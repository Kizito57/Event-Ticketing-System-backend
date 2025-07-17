import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8088';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsInVzZXJfaWQiOjMsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiSm9obiIsImVtYWlsIjoiZGVpdHkwNDdAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUyOTk5OTgwLCJpYXQiOjE3NTI3NDA3ODB9.Hwq089pfar5i7bFj00MdWUe5Qkt9nVnJt5f07Hy6xAk';
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

export default function () {
    const res = http.get(`${BASE_URL}/bookings`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'has data array': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return Array.isArray(body);
            } catch {
                return false;
            }
        },
    });

    sleep(1);
}