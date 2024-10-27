import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";
import { getAllCategoryNames, addNeCategory, deleteCategory } from "../controllers/category.controllers.js";
import { getPictures, deletePicture, uploadPicture, updatePictureDetails } from "../controllers/admin.controllers.js";
const router = express.Router();
router.post("/picture", verifyJWT, upload.single("picture"), uploadPicture)
router.get("/pictures", getPictures)

router.put("/picture/:id", verifyJWT, updatePictureDetails)

router.delete("/deletePicture/:id/:pictureURL", verifyJWT, deletePicture)
// category routes
router.post("/category", verifyJWT, addNeCategory)
router.get("/category", getAllCategoryNames)
router.delete("/category/:id", verifyJWT, deleteCategory)
export default router;