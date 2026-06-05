const axios = require('axios');
(async () => {
  try {
    const login = await axios.post('https://apiengine.kiuflow.online/api/v1/auth/login', { username: '573005925026', password: '123456' });
    const token = login.data.data.jwt;
    console.log("Token obtenido:", token.substring(0, 15) + "...");
    
    try {
      const getReq = await axios.get('https://apiengine.kiuflow.online/api/v1/user/settings', { headers: { Authorization: "Bearer " + token } });
      console.log("GET STATUS:", getReq.status);
    } catch(e) { console.error("GET ERROR:", e.response ? e.response.status : e.message); }
    
    try {
      const postReq = await axios.post('https://apiengine.kiuflow.online/api/v1/user/settings', {}, { headers: { Authorization: "Bearer " + token } });
      console.log("POST STATUS:", postReq.status);
      console.log("POST DATA:", postReq.data);
    } catch(e) { console.error("POST ERROR:", e.response ? e.response.status : e.message); }

  } catch(e) { console.error("LOGIN ERROR:", e.message); }
})();
