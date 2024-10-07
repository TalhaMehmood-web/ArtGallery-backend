import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";
import { createPost, getPosts, toggleLikePost } from "../controllers/post.controllers.js";

const router = express.Router();
router.post("/", verifyJWT, upload.single("picture"), createPost)
router.get("/", verifyJWT, getPosts)
router.post("/:postId/toggle-like", verifyJWT, toggleLikePost)
export default router;