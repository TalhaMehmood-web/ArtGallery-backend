import express from "express"
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet"
import morgan from "morgan"
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
app.use(helmet())
app.use(morgan('dev'));
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"], // Allow resources from the same origin
            scriptSrc: [
                "'self'", // Allow scripts from the same origin
                "https://cdnjs.cloudflare.com", // Example CDN for scripts
                "https://artgallery-backend-production.up.railway.app", // Your backend domain
            ],
            styleSrc: [
                "'self'", // Allow styles from the same origin
                "https://fonts.googleapis.com", // For Google Fonts
                "https://artgallery-backend-production.up.railway.app", // Your backend domain
            ],
            imgSrc: [
                "'self'", // Allow images from the same origin
                "data:", // Allow data URIs
                "https://artgallery-backend-production.up.railway.app", // Your backend domain
                "https://res.cloudinary.com/*", // Allow Cloudinary images
            ],
            connectSrc: [
                "'self'",
                "https://artgallery-backend-production.up.railway.app", // Allow API requests to your backend
                "https://api.cloudinary.com", // Allow requests to Cloudinary API
            ],
            // Add other directives as necessary
        },
    })
);
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// DB connection and server listening
connectDB()
    .then(() => {
        const server = app.listen(process.env.PORT, () => {
            console.log(`Server is running at port: ${process.env.PORT} !!`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                // Close your database connection here if necessary
                process.exit(0);
            });
        });
    })
    .catch((err) => {
        console.error(err);
    });