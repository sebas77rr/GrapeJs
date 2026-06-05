const axios = require('axios');
(async () => {
  try {
    const login = await axios.post('https://apiengine.kiuflow.online/api/v1/auth/login', { username: '573005925026', password: '123456' });
    const token = login.data.data.jwt;
    
    const pages = await axios.post('https://apiengine.kiuflow.online/api/v1/suscription/117/webPage/list', {}, { headers: { Authorization: "Bearer " + token } });
    const kfPage = pages.data.data[0];
    console.log("Published type:", typeof kfPage.published, "Value:", kfPage.published);
  } catch(e) { console.error("ERROR:", e.message); }
})();
