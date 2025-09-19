// Test script for Problem Statement API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test data
const testProblem = {
  title: "AI-Powered Personal Finance Manager",
  abstract: "Develop an intelligent personal finance management system that uses machine learning algorithms to analyze spending patterns, predict future expenses, and provide personalized financial advice. The system should include features like expense categorization, budget planning, investment recommendations, and financial goal tracking.",
  technologies: ["Python", "TensorFlow", "React", "Node.js", "MongoDB"],
  domain: "AI & Machine Learning",
  category: "Major",
  difficulty: "Advanced",
  duration: "12-16 weeks",
  deliverables: [
    "Complete source code with documentation",
    "Machine learning models for expense prediction",
    "User interface with responsive design",
    "Database schema and API documentation",
    "Deployment guide and demo video"
  ],
  prerequisites: [
    "Strong programming skills in Python",
    "Basic understanding of machine learning concepts",
    "Experience with web development (React/Node.js)",
    "Knowledge of database design"
  ],
  learningOutcomes: [
    "Implement machine learning algorithms for financial data analysis",
    "Design and develop full-stack web applications",
    "Work with real-time data processing and visualization",
    "Apply software engineering best practices",
    "Create user-friendly interfaces for complex data"
  ],
  tags: ["Machine Learning", "Finance", "Web Development", "Data Analysis"]
};

async function testAPI() {
  try {
    console.log('🧪 Testing Problem Statement API...\n');

    // Test 1: Create a problem statement
    console.log('1️⃣ Creating problem statement...');
    const createResponse = await axios.post(`${BASE_URL}/problems`, testProblem, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Problem created:', createResponse.data.data.id);
    const problemId = createResponse.data.data._id;

    // Test 2: Get all problems
    console.log('\n2️⃣ Getting all problems...');
    const getAllResponse = await axios.get(`${BASE_URL}/problems`);
    console.log('✅ Found', getAllResponse.data.count, 'problems');

    // Test 3: Get featured problems
    console.log('\n3️⃣ Getting featured problems...');
    const featuredResponse = await axios.get(`${BASE_URL}/problems/featured`);
    console.log('✅ Found', featuredResponse.data.count, 'featured problems');

    // Test 4: Search problems
    console.log('\n4️⃣ Searching problems...');
    const searchResponse = await axios.get(`${BASE_URL}/problems/search?q=AI`);
    console.log('✅ Found', searchResponse.data.count, 'AI-related problems');

    // Test 5: Get problems by domain
    console.log('\n5️⃣ Getting problems by domain...');
    const domainResponse = await axios.get(`${BASE_URL}/problems/domain/AI%20%26%20Machine%20Learning`);
    console.log('✅ Found', domainResponse.data.count, 'AI & ML problems');

    // Test 6: Get problem statistics
    console.log('\n6️⃣ Getting problem statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/problems/stats`, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
      }
    });
    console.log('✅ Statistics:', statsResponse.data.data.overview);

    // Test 7: Update problem status
    console.log('\n7️⃣ Updating problem status...');
    const statusResponse = await axios.put(`${BASE_URL}/problems/${problemId}/status`, 
      { status: 'Active' },
      {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
        }
      }
    );
    console.log('✅ Status updated to:', statusResponse.data.data.status);

    // Test 8: Toggle featured status
    console.log('\n8️⃣ Toggling featured status...');
    const featuredToggleResponse = await axios.put(`${BASE_URL}/problems/${problemId}/featured`, {}, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
      }
    });
    console.log('✅ Featured status:', featuredToggleResponse.data.data.featured);

    // Test 9: Test public API
    console.log('\n9️⃣ Testing public API...');
    const publicResponse = await axios.get(`${BASE_URL}/public/problems`);
    console.log('✅ Public API returned', publicResponse.data.count, 'problems');

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAPI();
