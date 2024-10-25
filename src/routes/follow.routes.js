import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { followUser } from "../controllers/follow.controller.js";



const router = express.Router();
router.post("/", verifyJWT, followUser)
export default router;