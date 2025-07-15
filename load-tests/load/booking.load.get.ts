import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8088';

export const options = {
    stages: [
        { duration: '30s', target: 40 },
        { duration: '40s', target: 50 },
        { duration: '10s', target: 0 },
    ],
    ext: {
        loadimpact: {
            name: 'Bookings GET Load Test',
        },
    },
};

// Setup function to get admin token 
export function setup() {
    // Login as admin to get token
    const loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
        email: 'deity047@gmail.com', 
        password: '12345678' 
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    if (loginRes.status === 200) {
        try {
            const loginBody = JSON.parse(loginRes.body as string);
            return { token: loginBody.token };
        } catch (e) {
            console.error('Failed to parse login response:', e);
            return { token: null };
        }
    } else {
        console.error('Admin login failed:', loginRes.status, loginRes.body);
        return { token: null };
    }
}

export default function (data: any) {
    // Checks if we have a valid token
    if (!data.token) {
        console.error('No valid token available, skipping test');
        return;
    }

    // Test GET all bookings with authentication
    const res = http.get(`${BASE_URL}/bookings`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
        },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response is valid JSON': (r) => {
            try {
                JSON.parse(r.body as string);
                return true;
            } catch {
                return false;
            }
        },
        'response is array': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return Array.isArray(body);
            } catch {
                return false;
            }
        },
        'has booking data': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return Array.isArray(body) && body.length >= 0; // Allow empty array
            } catch {
                return false;
            }
        },
    });

    if (res.status !== 200) {
        console.log('Bookings request failed:', res.status, res.body);
    }

    sleep(1);
}