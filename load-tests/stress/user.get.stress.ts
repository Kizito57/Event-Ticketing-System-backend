import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8088';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsInVzZXJfaWQiOjMsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiSm9obiIsImVtYWlsIjoiZGVpdHkwNDdAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUyOTk5OTgwLCJpYXQiOjE3NTI3NDA3ODB9.Hwq089pfar5i7bFj00MdWUe5Qkt9nVnJt5f07Hy6xAk';
export const options = {
     stages: [
        { duration: '30s', target: 20 },   // ramp-up to 20 users
        { duration: '30s', target: 100 },  // ramp-up to 100 users
        { duration: '30s', target: 200 },  // ramp-up to 200 users
        { duration: '1m', target: 300 },   // spike to 300 users
        { duration: '30s', target: 0 },    // ramp-down to 0 users
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