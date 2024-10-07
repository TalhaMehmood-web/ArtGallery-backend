import express from "express";
import {
    logoutUser,
    register,
    getToken,
    login,
    editProfile,
    userProfileAnalytics
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/signup", upload.single("profile"), register)
router.get("/get-token", getToken)
router.put("/edit", upload.single("profile"), verifyJWT, editProfile)
router.post("/login", login)
router.post("/logout", verifyJWT, logoutUser)
router.get("/data", verifyJWT, userProfileAnalytics)
export default router;