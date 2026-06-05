const express = require("express");
const router = express.Router();
const { getValidToken, getUserInfo } = require("../services/kiuflowAuth");
const kiuflowService = require("../services/kiuflowService");

// GET /api/clients - Retorna el usuario real logueado en KiuFlow
router.get("/", async (req, res) => {
  try {
    await getValidToken();
    const userInfo = getUserInfo(); // { id: 212 } del JWT
    const userId = userInfo?.id;

    // Obtener la suscripción activa
    const subs = await kiuflowService.getSuscriptions();
    const subId = Number(process.env.KIUFLOW_SUBSCRIPTION_ID) || 117;
    const mySub = subs.find(s => s.id === subId) || subs[0];

    // Obtener la lista de admins de la suscripción para cruzar con userId
    let userName = "Usuario KiuFlow";
    let userRole = "Admin";
    try {
      const admins = await kiuflowService.getAdmins(subId);
      const myAdmin = admins.find(a => a.user && a.user.id === userId);
      if (myAdmin) {
        userName = myAdmin.user.name || myAdmin.name || userName;
        userRole = myAdmin.propietary ? "Propietario" : "Admin";
      }
    } catch (e) {
      // Si falla la llamada de admins, usar el nombre de la suscripción
      console.error("Error obteniendo admins:", e.message);
    }

    res.json([
      {
        id: userId || 2,
        name: userName,
        role: userRole,
        subscription_name: mySub?.name || "KiuFlow",
        custom_domain: "web.kiuflow.online",
        created_at: new Date().toISOString()
      }
    ]);
  } catch (error) {
    console.error("Error obteniendo info del usuario:", error.message);
    res.json([
      {
        id: 2,
        name: "Usuario KiuFlow",
        custom_domain: "web.kiuflow.online",
        created_at: new Date().toISOString()
      }
    ]);
  }
});

module.exports = router;
