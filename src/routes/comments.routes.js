import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { createComment, getComments } from "../controllers/comments.controller.js";


const router = express.Router();
router.post("/:postId", verifyJWT, createComment)
router.get("/:postId", getComments)
export default router;