import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

const BASE_URL = 'http://localhost:8088';

// Replace with valid tokens for testing
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsInVzZXJfaWQiOjMsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiSm9obiIsImVtYWlsIjoiZGVpdHkwNDdAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUyODIyNzU3LCJpYXQiOjE3NTI1NjM1NTd9.ioJK_Doh74sjaquNWUklAmA2G3PO4QahRhUtLx6now0'; // Shortened
const USER_TOKEN = 'YOUR_USER_JWT_TOKEN';

// Replace with actual values from your DB
const TEST_BOOKING_ID = 1;
const TEST_USER_ID = 1;

export default function () {
  // 1. GET /bookings (Admin only)
  const res1 = http.get(`${BASE_URL}/bookings`, {
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  check(res1, {
    'GET /bookings: status is 200': (r) => r.status === 200,
    'GET /bookings: returns JSON': (r) =>
      r.headers['Content-Type']?.includes('application/json'),
  });

//   // 2. GET /bookings/:id
//   const res2 = http.get(`${BASE_URL}/bookings/${TEST_BOOKING_ID}`, {
//     headers: {
//       Authorization: `Bearer ${USER_TOKEN}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   check(res2, {
//     'GET /bookings/:id: status is 200 or 404': (r) =>
//       r.status === 200 || r.status === 404,
//     'GET /bookings/:id: returns JSON': (r) =>
//       r.headers['Content-Type']?.includes('application/json'),
//   });

//   // 3. GET /bookings/user/:userId
//   const res3 = http.get(`${BASE_URL}/bookings/user/${TEST_USER_ID}`, {
//     headers: {
//       Authorization: `Bearer ${USER_TOKEN}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   check(res3, {
//     'GET /bookings/user/:userId: status is 200': (r) => r.status === 200,
//     'GET /bookings/user/:userId: returns JSON': (r) =>
//       r.headers['Content-Type']?.includes('application/json'),
//   });

//   // 4. POST /bookings
//   const newBooking = {
//     user_id: TEST_USER_ID,
//     car_id: 1,
//     pickup_date: '2025-07-20T09:00:00Z',
//     return_date: '2025-07-22T09:00:00Z',
//     pickup_location: 'Downtown',
//     return_location: 'Airport',
//     status: 'pending',
//   };

//   const res4 = http.post(`${BASE_URL}/bookings`, JSON.stringify(newBooking), {
//     headers: {
//       Authorization: `Bearer ${USER_TOKEN}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   check(res4, {
//     'POST /bookings: status is 201 or 400': (r) =>
//       r.status === 201 || r.status === 400,
//     'POST /bookings: returns JSON': (r) =>
//       r.headers['Content-Type']?.includes('application/json'),
//   });

//   // 5. PUT /bookings/:id
//   const updatePayload = {
//     status: 'confirmed',
//   };

//   const res5 = http.put(
//     `${BASE_URL}/bookings/${TEST_BOOKING_ID}`,
//     JSON.stringify(updatePayload),
//     {
//       headers: {
//         Authorization: `Bearer ${ADMIN_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//     }
//   );

//   check(res5, {
//     'PUT /bookings/:id: status is 200 or 404': (r) =>
//       r.status === 200 || r.status === 404,
//     'PUT /bookings/:id: returns JSON': (r) =>
//       r.headers['Content-Type']?.includes('application/json'),
//   });

//   // 6. DELETE /bookings/:id
//   const res6 = http.del(`${BASE_URL}/bookings/${TEST_BOOKING_ID}`, null, {
//     headers: {
//       Authorization: `Bearer ${ADMIN_TOKEN}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   check(res6, {
//     'DELETE /bookings/:id: status is 200 or 404': (r) =>
//       r.status === 200 || r.status === 404,
//     'DELETE /bookings/:id: returns JSON': (r) =>
//       r.headers['Content-Type']?.includes('application/json'),
//   });

  sleep(1);
}
