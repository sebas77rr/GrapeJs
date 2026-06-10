const axios = require('axios');
require('dotenv').config();

const KIUFLOW_API_URL = process.env.KIUFLOW_API_URL || "https://apiengine.kiuflow.online";
const KIUFLOW_USERNAME = process.env.KIUFLOW_USERNAME;
const KIUFLOW_PASSWORD = process.env.KIUFLOW_PASSWORD;

let cachedToken = null;
let tokenExpirationTime = null;
let cachedUserInfo = null;

// asyncLocalStorage will be required locally when needed

function isExternalTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const expiry = payload.exp ? (payload.exp * 1000) - (5 * 60 * 1000) : Date.now() + (8 * 60 * 60 * 1000);
    return Date.now() < expiry;
  } catch(e) {
    return true; // Fallback: let the KiuFlow API handle the validation
  }
}

// Funciones dummy por compatibilidad (ya no se usan con el refactor stateless)
function setExternalToken() {}
function clearExternalToken() {}

/**
 * Realiza el login contra KiuFlow con credenciales del .env (fallback de desarrollo o páginas públicas)
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
 * PRIORIDAD: 1) Token enviado en el header de la petición actual (SSO)
 *            2) Token del .env (fallback para peticiones públicas)
 */
async function getValidToken() {
  // Prioridad 1: Token inyectado en la petición HTTP desde el frontend
  let requestToken = null;
  try {
    const { asyncLocalStorage } = require('../server');
    requestToken = asyncLocalStorage ? asyncLocalStorage.getStore() : null;
  } catch (e) {
    // ignorar error circular temporal si ocurre
  }
  
  if (isExternalTokenValid(requestToken)) {
    return requestToken;
  }

  // Prioridad 2: token del .env (necesario para las páginas públicas /p/ y /f/)
  const USE_ENV_FALLBACK = true; 

  if (USE_ENV_FALLBACK) {
    if (!cachedToken || !tokenExpirationTime || Date.now() > tokenExpirationTime) {
      console.log("[Auth] Usando credenciales del .env (modo público/fallback)...");
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