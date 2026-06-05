const axios = require('axios');
(async () => {
  try {
    const login = await axios.post('https://apiengine.kiuflow.online/api/v1/auth/login', { username: '573005925026', password: '123456' });
    const token = login.data.data.jwt;
    
    // get clients
    const clients = await axios.post('https://apiengine.kiuflow.online/api/v1/suscription/117/client/list', {}, { headers: { Authorization: "Bearer " + token } });
    console.log("Total clients:", clients.data.data.length);
    if(clients.data.data.length > 0) {
      console.log("Last client:", JSON.stringify(clients.data.data[clients.data.data.length - 1], null, 2));
    }
  } catch(e) { console.error("ERROR:", e.message); }
})();
