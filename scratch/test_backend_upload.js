async function testUpload() {
  try {
    console.log('1. Logging in to http://localhost:5001/api/auth/login...');
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@hcm.ai', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData?.data?.token || loginData?.token;
    console.log('2. Token acquired:', token ? 'YES (Token received)' : 'NO (Failed)');

    console.log('3. Preparing FormData upload...');
    const formData = new FormData();
    const blob = new Blob(['Sample PDF content for document upload test'], { type: 'application/pdf' });
    formData.append('file', blob, 'sample_test_doc.pdf');
    formData.append('name', 'Sample Test Document');
    formData.append('category', 'Contracts');
    formData.append('size', '12.4 KB');

    console.log('4. Sending POST to http://localhost:5001/api/employee/documents...');
    const uploadRes = await fetch('http://localhost:5001/api/employee/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await uploadRes.json();
    console.log('5. Backend HTTP Status:', uploadRes.status);
    console.log('6. Backend Upload Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Test Upload Exception:', err);
  }
}

testUpload();
