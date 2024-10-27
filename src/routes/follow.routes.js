import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { followUser, unfollowUser } from "../controllers/follow.controller.js";



const router = express.Router();
router.post("/", verifyJWT, followUser)
router.delete('/:userIdToUnfollow', verifyJWT, unfollowUser);
export default router;