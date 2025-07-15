import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1,
    iterations: 1,
    duration: '10s',
};

export default function () {


    const headers = {
        headers: { 'Content-Type': 'application/json' }
    };


    // 2. Login User
    const loginPayload = JSON.stringify({
        email: 'dkwanjiru097@gmail.com',
        password: 'mypassword123',
    });

    const loginRes = http.post('http://localhost:8088/users/login', loginPayload, headers);

    check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login response has token': (r) => {
            try {
                const body = typeof r.body === 'string' ? JSON.parse(r.body) : {};
                return typeof body.token === 'string';
            } catch {
                return false;
            }
        },
    });

    // // 3. Verify Email
    // const verifyPayload = JSON.stringify({
    //     email: 'dkwanjiru097@gmail.com',
    //     verification_code: '756040', // Replace with correct code if needed
    // });

    // const verifyRes = http.post('http://localhost:8088/users/verify', verifyPayload, headers);

    // check(verifyRes, {
    //     'verify status is 200 or 400': (r) => r.status === 200 || r.status === 400, // 400 if invalid code
    // });

   

    sleep(1);
}
