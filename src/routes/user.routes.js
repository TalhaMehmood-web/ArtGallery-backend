import express from "express";
import {
    //     changePassword,
    //     forgetPassword,
    //     getSingleUser,
    //     getUsers,
    //     login,
    logoutUser,
    register,
    getToken,
    login
    //     updateProfile,
    //     resetPassword,
    //     editProfile
} from "../controllers/user.controllers.js";
// import { upload } from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", register)
router.get("/get-token", getToken)
router.post("/login" , login)
router.post("/logout", verifyJWT, logoutUser)
export default router;