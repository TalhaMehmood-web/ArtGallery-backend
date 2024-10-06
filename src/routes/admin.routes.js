import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/isAdmin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getAllCategoryNames, addNeCategory, deleteCategory } from "../controllers/category.controllers.js";
import { getPictures, deletePicture, uploadPicture, updatePictureDetails } from "../controllers/admin.controllers.js";
const router = express.Router();
router.post("/picture", verifyJWT, isAdmin, upload.single("picture"), uploadPicture)
router.get("/pictures", verifyJWT, getPictures)

router.put("/picture/:id", verifyJWT, isAdmin, updatePictureDetails)

router.delete("/deletePicture/:id/:pictureURL", verifyJWT, isAdmin, deletePicture)
// category routes
router.post("/category", verifyJWT, isAdmin, addNeCategory)
router.get("/category", verifyJWT, getAllCategoryNames)
router.delete("/category/:id", verifyJWT, isAdmin, deleteCategory)
export default router;