import express from "express"
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/db/index.js";
import cookieParser from "cookie-parser";
import userRoutes from "./src/routes/user.routes.js"
import adminRoutes from "./src/routes/admin.routes.js"
import postRoutes from "./src/routes/post.routes.js"
import commentRoutes from "./src/routes/comments.routes.js"
import auctionRoutes from "./src/routes/auction.routes.js"
dotenv.config();
const app = express()
app.use(express.json())
app.use(cookieParser())


const FRONTEND_ORIGIN = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_ORIGIN_PROD
    : process.env.FRONTEND_ORIGIN_DEV;
app.use(cors({
    origin: FRONTEND_ORIGIN,
    credentials: true
}));

// routes declaration

app.get('/api/v1/', (_, res) => {
    console.log("hello");
    res.send(`<h2> ${process.env.NODE_ENV === 'production' ? "production deployed" : "development"} </h2>`);

});
app.use("/api/v1/user", userRoutes)
app.use("/api/v1/admin", adminRoutes)
app.use("/api/v1/post", postRoutes)
app.use("/api/v1/comment", commentRoutes)
app.use("/api/v1/auction", auctionRoutes)
// db connection and server listening
connectDB()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running at port:${process.env.PORT} !!`);
        });
    })
    .catch((err) => {
        console.log(err);
    });