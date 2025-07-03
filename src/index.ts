import express from 'express';
import  userRoutes from './User/user.router';


const app = express();
app.use(express.json()); //used to parse JSON bodies




//Routes
userRoutes(app);

app.listen(8080, () => {
    console.log(`Server is running on http://localhost:8088`);
});