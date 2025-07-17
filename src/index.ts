import express from 'express';
import  userRoutes from './User/user.router';
import bookingRoutes from './Booking/booking.router';
import paymentsRoutes from './Payments/payment.router';
import  supportTicketRoutes from './Supportticket/support-ticket.router';
import  eventRoutes from './Events/event.router';
import venueRoutes from './Venue/venue.router';

import cors from "cors";
import uploadRouter from './uploads/upload.router';

const app = express();
app.use(express.json()); //used to parse JSON bodies
app.use(cors());





//Routes
userRoutes(app);
bookingRoutes(app);
eventRoutes(app);
venueRoutes(app);
paymentsRoutes(app);
supportTicketRoutes(app);

app.use('/api/upload', uploadRouter);


app.listen(8088, () => {
    console.log(`Server is running on http://localhost:8088`);
});