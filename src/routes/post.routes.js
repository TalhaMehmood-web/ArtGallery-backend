import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";
import { createPost, deletePost, getPosts, toggleLikePost } from "../controllers/post.controllers.js";

const router = express.Router();
router.post("/", verifyJWT, upload.single("picture"), createPost)
router.get("/", getPosts)
router.post("/:postId/toggle-like", verifyJWT, toggleLikePost)
router.delete("/:postId", verifyJWT, deletePost)
export default router;