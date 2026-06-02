const axios = require('axios');
require('dotenv').config();

const KIUFLOW_API_URL = process.env.KIUFLOW_API_URL;
const KIUFLOW_USERNAME = process.env.KIUFLOW_USERNAME;
const KIUFLOW_PASSWORD = process.env.KIUFLOW_PASSWORD;

let cachedToken = null;
let tokenExpirationTime = null;
let cachedUserInfo = null;

/**
 * Realiza el login contra KiuFlow y almacena el JWT
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

        /**
         * Invalidación de token.
         * Se extrae el tiempo de expiración real del token (exp) y se resta un 
         * margen de seguridad de 5 minutos para renovarlo preventivamente.
         */
        tokenExpirationTime = payload.exp
          ? (payload.exp * 1000) - (5 * 60 * 1000)
          : Date.now() + (24 * 60 * 60 * 1000); // fallback a 24h

      } catch (e) {
        cachedUserInfo = response.data.data.user || { name: null };
        tokenExpirationTime = Date.now() + (24 * 60 * 60 * 1000);
      }
      
      return cachedToken;
    } else {
      throw new Error("Respuesta de login no contiene JWT");
    }
  } catch (error) {
    console.error("Error en kiuflowAuth.login:", error.message);
    throw error;
  }
}

/**
 * Obtiene el token actual o hace login si ha expirado
 */
async function getValidToken() {
  if (!cachedToken || !tokenExpirationTime || Date.now() > tokenExpirationTime) {
    console.log("Renovando token JWT de KiuFlow...");
    await login();
  }
  return cachedToken;
}

function getUserInfo() {
  return cachedUserInfo;
}

module.exports = {
  getValidToken,
  login,
  getUserInfo
};