import express from 'express';
import  userRoutes from './User/user.router';


const app = express();

const PORT = 8080;


userRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});