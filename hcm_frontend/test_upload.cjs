const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
  const form = new FormData();
  form.append('name', 'API_DEBUG_TEST.pdf');
  form.append('category', 'Other');
  form.append('size', '1 KB');
  
  // create dummy file
  fs.writeFileSync('dummy.pdf', 'dummy content');
  form.append('file', fs.createReadStream('dummy.pdf'));

  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'user1@hcm.com',
      password: 'password123'
    });
    
    let token = loginRes.data?.data?.token;

    console.log('Got token? ', !!token);
    
    const res = await axios.post('http://localhost:5000/api/employee/documents', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('UPLOAD STATUS:', res.status);
    console.log('UPLOAD DATA:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('UPLOAD ERROR:', err.response?.data || err.message);
  }
}

testUpload();
