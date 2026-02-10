
// Native fetch used in Node 18+

const API_URL = 'http://localhost:3000/api/auth';

async function testLogin() {
    console.log('--- Starting Login Test ---');

    // 1. Register a test user (in case they don't exist)
    const testUser = {
        email: `test_${Date.now()}@example.com`,
        password: 'password123!',
        name: 'Test User'
    };

    console.log('1. Registering user:', testUser.email);
    const regRes = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    console.log('Registration status:', regRes.status);

    // 2. Login
    console.log('2. Logging in...');
    const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testUser.email,
            password: testUser.password
        })
    });

    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);

    if (!loginData.success) {
        console.error('Login failed:', loginData);
        return;
    }

    const token = loginData.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');

    // 3. Get Me
    console.log('3. Getting User Profile (/me) with token...');
    const meRes = await fetch(`${API_URL}/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    const meData = await meRes.json();
    console.log('Me status:', meRes.status);
    console.log('Me success:', meData.success);

    if (meData.success) {
        console.log('SUCCESS: Server authentication is working correctly.');
    } else {
        console.error('FAILURE: /me endpoint rejected the token.', meData);
    }
}

testLogin().catch(console.error);
