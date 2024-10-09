import express from "express";
import {
    logoutUser,
    register,
    login,
    editProfile,
    userProfileAnalytics,
    refreshToken,
    getUser
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/signup", upload.single("profile"), register)
router.get("/refresh-token", refreshToken)
router.put("/edit", upload.single("profile"), verifyJWT, editProfile)
router.post("/login", login)
router.post("/logout", verifyJWT, logoutUser)
router.get("/data", verifyJWT, userProfileAnalytics)
router.get("/", verifyJWT, getUser)
export default router;