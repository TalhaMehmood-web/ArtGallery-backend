import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./src/db/index.js";
import cookieParser from "cookie-parser";
import userRoutes from "./src/routes/user.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import postRoutes from "./src/routes/post.routes.js";
import commentRoutes from "./src/routes/comments.routes.js";
import auctionRoutes from "./src/routes/auction.routes.js";

dotenv.config();
const app = express();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://homemadeheaven.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://artgallery-backend-production.up.railway.app"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://artgallery-backend-production.up.railway.app"],
            imgSrc: ["'self'", "data:", "https://artgallery-backend-production.up.railway.app", "https://res.cloudinary.com/*"],
            connectSrc: ["'self'", "https://artgallery-backend-production.up.railway.app", "https://api.cloudinary.com"],
        },
    })
);

// CORS setup
const FRONTEND_ORIGIN = process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_ORIGIN_PROD
    : process.env.FRONTEND_ORIGIN_DEV;

app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],

    })
);

// Preflight OPTIONS request handling
app.options("*", cors());

// Routes
app.get("/api/v1/", (_, res) => {
    console.log("hello");
    res.send(
        `<h2>${process.env.NODE_ENV === "production" ? "production deployed" : "development"}</h2>`
    );
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/comment", commentRoutes);
app.use("/api/v1/auction", auctionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
});

// Database connection and server listening
connectDB()
    .then(() => {
        const server = app.listen(process.env.PORT, () => {
            console.log(`Server is running at port: ${process.env.PORT} !!`);
        });

        // Graceful shutdown
        process.on("SIGTERM", () => {
            console.log("SIGTERM received: closing HTTP server");
            server.close(() => {
                console.log("HTTP server closed");
                process.exit(0);
            });
        });
    })
    .catch((err) => {
        console.error(err);
    });
