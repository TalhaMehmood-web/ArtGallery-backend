import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { createComment, getComments } from "../controllers/comments.controller.js";


const router = express.Router();
router.post("/", verifyJWT, createComment)
router.get("/:postId", verifyJWT, getComments)
export default router;