const axios = require('axios');
require('dotenv').config();

const KIUFLOW_API_URL = process.env.KIUFLOW_API_URL;
const KIUFLOW_USERNAME = process.env.KIUFLOW_USERNAME;
const KIUFLOW_PASSWORD = process.env.KIUFLOW_PASSWORD;

let cachedToken = null;
let tokenExpirationTime = null;
let cachedUserInfo = null;

// ─────────────────────────────────────────────
// Token externo (pasado por el usuario desde KiuFlow via URL)
// Cuando KiuFlow abra el builder con ?token=xxx, este se setea aquí
// y tiene prioridad sobre el token del .env
// ─────────────────────────────────────────────
let externalToken = null;
let externalTokenExpiry = null;

/**
 * Recibe el JWT del usuario autenticado en KiuFlow (SSO)
 * Se llama desde el endpoint /api/auth/set-token
 */
function setExternalToken(jwt) {
  externalToken = jwt;
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    // Expira 5 minutos antes de su tiempo real
    externalTokenExpiry = payload.exp
      ? (payload.exp * 1000) - (5 * 60 * 1000)
      : Date.now() + (8 * 60 * 60 * 1000); // fallback 8h
    
    cachedUserInfo = {
      id: payload.userId || payload.sub || null,
      name: payload.name || payload.userName || payload.username || null,
      email: payload.email || null
    };
    console.log('[Auth] Token externo de KiuFlow recibido. Usuario:', cachedUserInfo?.name || 'desconocido');
  } catch (e) {
    externalTokenExpiry = Date.now() + (8 * 60 * 60 * 1000);
    console.log('[Auth] Token externo recibido (sin payload decodificable)');
  }
}

function clearExternalToken() {
  externalToken = null;
  externalTokenExpiry = null;
  cachedUserInfo = null;
  console.log('[Auth] Token externo eliminado');
}

function isExternalTokenValid() {
  return externalToken && externalTokenExpiry && Date.now() < externalTokenExpiry;
}

/**
 * Realiza el login contra KiuFlow con credenciales del .env (fallback de desarrollo)
 */
async function login() {
  try {
    const response = await axios.post(`${KIUFLOW_API_URL}/api/v1/auth/login`, {
      username: KIUFLOW_USERNAME,
      password: KIUFLOW_PASSWORD
    });

    if (response.data && response.data.success && response.data.data && response.data.data.jwt) {
      cachedToken = response.data.data.jwt;
      
      try {
        const payload = JSON.parse(Buffer.from(cachedToken.split('.')[1], 'base64').toString());
        
        cachedUserInfo = {
          id: payload.userId || payload.sub || null,
          name: payload.name || payload.userName || payload.username || null,
          email: payload.email || null
        };

        tokenExpirationTime = payload.exp
          ? (payload.exp * 1000) - (5 * 60 * 1000)
          : Date.now() + (24 * 60 * 60 * 1000);

      } catch (e) {
        cachedUserInfo = response.data.data.user || { name: null };
        tokenExpirationTime = Date.now() + (24 * 60 * 60 * 1000);
      }
      
      return cachedToken;
    } else {
      throw new Error("Respuesta de login no contiene JWT");
    }
  } catch (error) {
    console.error("[Auth] Error en login con credenciales .env:", error.message);
    throw error;
  }
}

/**
 * Retorna el token válido.
 * PRIORIDAD: 1) Token externo del usuario (SSO desde KiuFlow) 
 *            2) Token del .env (fallback para desarrollo)
 */
async function getValidToken() {
  // Prioridad 1: token del usuario real pasado desde KiuFlow
  if (isExternalTokenValid()) {
    return externalToken;
  }

  // Prioridad 2: token del .env (modo desarrollo/fallback)
  const USE_ENV_FALLBACK = false; 

  if (USE_ENV_FALLBACK) {
    if (!cachedToken || !tokenExpirationTime || Date.now() > tokenExpirationTime) {
      console.log("[Auth] Usando credenciales del .env (modo fallback)...");
      await login();
    }
    return cachedToken;
  }

  throw new Error("No hay token de sesión activo. Usuario no autenticado.");
}

function getUserInfo() {
  return cachedUserInfo;
}

module.exports = {
  getValidToken,
  login,
  setExternalToken,
  clearExternalToken,
  isExternalTokenValid,
  getUserInfo
};