const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCSVUpload() {
  try {
    console.log('🧪 Testing CSV Upload Functionality...\n');

    // First, let's test the template download
    console.log('1. Testing template download...');
    try {
      const templateResponse = await axios.get('http://localhost:5000/api/v1/problems/template', {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // You'll need to get a real token
        }
      });
      console.log('✅ Template download endpoint is working');
    } catch (error) {
      console.log('⚠️ Template download failed (expected without auth):', error.response?.status);
    }

    // Test CSV upload
    console.log('\n2. Testing CSV upload...');
    const csvPath = path.join(__dirname, 'test-problems.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ Test CSV file not found');
      return;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(csvPath));

    try {
      const uploadResponse = await axios.post('http://localhost:5000/api/v1/problems/bulk-upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // You'll need to get a real token
        }
      });
      
      console.log('✅ CSV upload successful!');
      console.log('Response:', uploadResponse.data);
    } catch (error) {
      console.log('⚠️ CSV upload failed (expected without auth):', error.response?.status);
      if (error.response?.data) {
        console.log('Error details:', error.response.data);
      }
    }

    console.log('\n🎉 CSV upload functionality test completed!');
    console.log('\n📝 To test with authentication:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Get a JWT token by logging in via the CMS frontend');
    console.log('3. Replace YOUR_JWT_TOKEN_HERE with the actual token');
    console.log('4. Run this script again');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCSVUpload();
