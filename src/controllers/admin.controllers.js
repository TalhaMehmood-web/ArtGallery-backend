import asyncHandler from "express-async-handler";
import uploadOnCloudinary, { deleteFromCloudinary } from "../utils/cloudinary.js"; // Path to your Cloudinary upload function
import Picture from "../models/pictures.model.js"; // Path to your Mongoose model
import { getPictureName } from "../utils/getPictureName.js";
import Category from "../models/category.model.js";
import mongoose from "mongoose";
export const uploadPicture = asyncHandler(async (req, res) => {
    try {
        const { type, category, price, description, title } = req.body;

        const uploadedBy = req.user._id; // Assuming `req.user` is populated by authentication middleware

        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Upload the file to Cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(req.file?.path);

        if (!cloudinaryResponse) {
            return res.status(500).json({ message: "Failed to upload image to Cloudinary." });
        }
        const categoryName = await Category.findOne({ name: category });

        if (!categoryName) {
            return res.status(400).json({ message: "Category not found" });
        }
        // Create a new Picture document
        const newPicture = new Picture({
            title,
            price,
            description,
            picture: cloudinaryResponse?.secure_url || "",
            type,
            category: categoryName._id, // Use category ObjectId
            uploadedBy, // Assuming user is attached to req
        });

        // Save to MongoDB
        await newPicture.save();

        // Send success response
        res.status(201).json({
            message: "Picture uploaded successfully.",
            picture: newPicture,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});
export const getPictures = asyncHandler(async (req, res) => {
    try {
        const { category, type } = req.query;

        // Build query object
        let query = {};

        // Filter by category if provided
        if (category && category !== "all") {
            if (mongoose.Types.ObjectId.isValid(category)) {
                query.category = category;
            } else {
                return res.status(400).json({ error: "Invalid category ID" });
            }
        }

        // Handle type filtering
        if (type && type !== "all") {
            // If type is "both", include "auction" and "homePage" in query
            if (type === "both") {
                query.$or = [{ type: "auction" }, { type: "homePage" }];
            } else {
                query.$or = [{ type: type }, { type: "both" }];
            }
        }

        // Fetch pictures based on the constructed query
        const pictures = await Picture.find(query).populate('category').sort({ createdAt: -1 });
        return res.status(200).json(pictures);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export const updatePictureDetails = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const fieldsToUpdate = req.body;

        // Validate if id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        // Find the picture by ID and update the fields
        const updatedPicture = await Picture.findByIdAndUpdate(
            id,
            { ...fieldsToUpdate }, // Spread the fieldsToUpdate into the update object
            { new: true, runValidators: true } // Options to return the updated document and run validation
        );

        if (!updatedPicture) {
            return res.status(404).json({ message: "Picture not found" });
        }

        return res.status(200).json(updatedPicture);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
export const deletePicture = asyncHandler(async (req, res) => {
    try {
        const { id, pictureURL } = req.params

        const pictureName = getPictureName(pictureURL);
        const deletePicture = await deleteFromCloudinary(pictureName);
        if (!deletePicture) {
            return res.status(400).json({ message: "Picture not deleted from cloud" })
        }
        const isPictureDeleted = await Picture.findByIdAndDelete(id)
        if (!isPictureDeleted) return res.status(404).json({ message: "Failed To Delete Picture" });

        return res.status(200).json({ message: "Picture deleted successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
})
