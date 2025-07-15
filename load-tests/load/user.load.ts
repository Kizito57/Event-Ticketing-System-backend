import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8088';

export const options = {
    stages: [
        { duration: '20s', target: 50 }, // Ramp-up to 50 users in 20s
        { duration: '30s', target: 50 }, // Stay at 50 users for 30s
        { duration: '10s', target: 0 },  // Ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'User Login Load Test',
        },
    },
};

export default function () {
    // Use existing admin credentials (create one admin first)
    const email = 'deity047@gmail.com';
    const password = '12345678';

    // Test login endpoint
    const loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
        email,
        password
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
        'Login status is 200': (res) => res.status === 200,
        'Response is valid JSON': (res) => {
            try {
                JSON.parse(res.body as string);
                return true;
            } catch {
                return false;
            }
        },
        'Received token': (res) => {
            try {
                const body = JSON.parse(res.body as string);
                return !!body.token;
            } catch {
                return false;
            }
        },
        'Has admin data': (res) => {
            try {
                const body = JSON.parse(res.body as string);
                return body.admin && body.admin.role === 'admin';
            } catch {
                return false;
            }
        },
    });

    if (loginRes.status !== 200) {
        console.log('Login failed:', loginRes.body);
    }

    // Test getting all users (admin endpoint)
    let token = null;
    try {
        const loginBody = JSON.parse(loginRes.body as string);
        token = loginBody.token;
    } catch (e) {
        console.log('Failed to parse login response');
    }

    if (token) {
        const usersRes = http.get(`${BASE_URL}/users`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        check(usersRes, {
            'Get users status is 200': (res) => res.status === 200,
            'Users response is array': (res) => {
                try {
                    const body = JSON.parse(res.body as string);
                    return Array.isArray(body);
                } catch {
                    return false;
                }
            },
        });
    }

    sleep(1);
}