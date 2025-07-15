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

    //    1. Register User
    const registerPayload = JSON.stringify({
        first_name:  'Test ',
        last_name: 'User',
        email: 'dkwanjiru097@gmail.com',
        password: 'mypassword123'
    });

       const registerRes = http.post('http://localhost:8088/users/register', registerPayload, headers);

    check(registerRes, {
        'register status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    });

     // // 2. Create Admin
    // const adminPayload = JSON.stringify({
    //     name: 'Admin User',
    //     email: 'admin@example.com',
    //     password: 'adminpass123',
    //     role: 'admin'
    // });

    // const adminRes = http.post('http://localhost:8088/admin/create', adminPayload, headers);

    // check(adminRes, {
    //     'admin create status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    // });

    
    sleep(1);
}