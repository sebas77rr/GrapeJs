const axios = require('axios');
require('dotenv').config();
const crypto = require('crypto');

const KIUFLOW_API_URL = process.env.KIUFLOW_API_URL || "https://apiengine.kiuflow.online";
const KIUFLOW_USERNAME = process.env.KIUFLOW_USERNAME;
const KIUFLOW_PASSWORD = process.env.KIUFLOW_PASSWORD;

let cachedToken        = null;
let tokenExpirationTime = null;
let cachedUserInfo     = null;
let loginPromise       = null; // Singleton para evitar race condition bajo carga concurrente

// ── Verifica si un token JWT externo (del usuario) sigue vigente ──
function isExternalTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const expiry = payload.exp
      ? (payload.exp * 1000) - (5 * 60 * 1000)
      : Date.now() + (8 * 60 * 60 * 1000);
    return Date.now() < expiry;
  } catch(e) {
    return true; // Dejar que la API de KiuFlow valide si el JWT es malformado
  }
}

// ── Limpia el token en caché (llamar cuando KiuFlow devuelve 401) ──
function clearExternalToken() {
  cachedToken = null;
  tokenExpirationTime = null;
}

// Stub de compatibilidad — no se usa en el flujo stateless actual
function setExternalToken() {}

// ── Login con credenciales del servidor (fallback para páginas públicas) ──
async function login() {
  try {
    const response = await axios.post(`${KIUFLOW_API_URL}/api/v1/auth/login`, {
      username: KIUFLOW_USERNAME,
      password: KIUFLOW_PASSWORD,
    });

    if (response.data?.success && response.data?.data?.jwt) {
      cachedToken = response.data.data.jwt;

      try {
        const payload = JSON.parse(Buffer.from(cachedToken.split('.')[1], 'base64').toString());
        cachedUserInfo = {
          id:    payload.userId || payload.sub  || null,
          name:  payload.name  || payload.userName || payload.username || null,
          email: payload.email || null,
        };
        tokenExpirationTime = payload.exp
          ? (payload.exp * 1000) - (5 * 60 * 1000)
          : Date.now() + (24 * 60 * 60 * 1000);
      } catch (e) {
        cachedUserInfo      = response.data.data.user || { name: null };
        tokenExpirationTime = Date.now() + (24 * 60 * 60 * 1000);
      }

      return cachedToken;
    } else {
      throw new Error("La respuesta de login no contiene JWT");
    }
  } catch (error) {
    console.error("[Auth] Error en login con credenciales del servidor:", error.message);
    throw error;
  }
}

/**
 * Retorna un token válido para llamar a la API de KiuFlow.
 *
 * Prioridad:
 *   1) Token del usuario (SSO) inyectado via AsyncLocalStorage en cada request
 *   2) Token de servicio obtenido con las credenciales del servidor (.env)
 */
async function getValidToken() {
  // Prioridad 1: token del usuario en la petición HTTP actual
  let requestToken = null;
  try {
    const { asyncLocalStorage } = require('../server');
    requestToken = asyncLocalStorage?.getStore() ?? null;
  } catch (e) {
    console.warn("[Auth] No se pudo leer asyncLocalStorage:", e.message);
  }

  if (isExternalTokenValid(requestToken)) return requestToken;

  // Prioridad 2: token de servicio (para páginas públicas y rutas sin sesión)
  if (!cachedToken || !tokenExpirationTime || Date.now() > tokenExpirationTime) {
    // Singleton: si ya hay un login en curso, esperamos ese mismo en vez de lanzar otro
    if (!loginPromise) {
      loginPromise = login().finally(() => { loginPromise = null; });
    }
    await loginPromise;
  }

  if (!cachedToken) throw new Error("[Auth] No se pudo obtener token de servicio. Revisa KIUFLOW_USERNAME y KIUFLOW_PASSWORD.");
  return cachedToken;
}

function getUserInfo() { return cachedUserInfo; }

// ── Seguridad de URLs de Encuestas (HMAC) ──
function signClientUrl(clientId) {
  if (!clientId) return null;
  const secret = process.env.JWT_SECRET || 'kiuflow-default-secret-2026';
  return crypto.createHmac('sha256', secret).update(String(clientId)).digest('hex');
}

function verifyClientUrl(clientId, hash) {
  if (!clientId || !hash) return false;
  const expectedHash = signClientUrl(clientId);
  // Usar validación segura contra ataques de timing
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  } catch (e) {
    return false; // Error si las longitudes no coinciden
  }
}

module.exports = {
  getValidToken,
  login,
  clearExternalToken,
  setExternalToken,
  isExternalTokenValid,
  getUserInfo,
  signClientUrl,
  verifyClientUrl,
};