import axios from 'axios';
import asyncHandler from "express-async-handler";
import uploadOnCloudinary, { deleteFromCloudinary } from "../utils/cloudinary.js"; // Path to your Cloudinary upload function
import Picture from "../models/pictures.model.js"; // Path to your Mongoose model
import { getPictureName } from "../utils/getPictureName.js";
import Category from "../models/category.model.js";
import mongoose from "mongoose";
import Auction from "../models/auction.model.js";
export const uploadPicture = asyncHandler(async (req, res) => {
    try {
        const { type, category, price, description, title, isBannerImage } = req.body;
        const uploadedBy = req.user._id;

        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Upload the file to Cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(req.file?.path);

        if (!cloudinaryResponse) {
            return res.status(500).json({ message: "Failed to upload image to Cloudinary." });
        }

        // Check if it's a banner image or not
        if (!isBannerImage) {
            // If not a banner image, validate required fields
            if (!type || !category || !price || !description || !title) {
                return res.status(400).json({
                    message: "All fields are required for non-banner images.",
                });
            }

            // Find the category only if it's not a banner image
            const categoryName = await Category.findOne({ name: category });

            if (!categoryName) {
                return res.status(400).json({ message: "Category not found" });
            }

            // Create a new Picture document
            const newPicture = new Picture({
                title, // Title is required for non-banner images
                price, // Price is required for non-banner images
                description, // Description is required for non-banner images
                picture: cloudinaryResponse?.secure_url || "",
                type, // Type is required for non-banner images
                category: categoryName._id, // Category is required for non-banner images
                uploadedBy, // Assuming user is attached to req
                isBannerImage: false, // Store whether it's a banner image
            });

            // Save to MongoDB
            await newPicture.save();

            // Send success response
            return res.status(201).json({
                message: "Picture uploaded successfully.",
                picture: newPicture,
            });

        } else {
            // Create a new banner Picture document
            const newBannerPicture = new Picture({
                picture: cloudinaryResponse?.secure_url || "", // Only the picture is required
                uploadedBy, // Assuming user is attached to req
                isBannerImage: true, // Mark as a banner image
            });

            // Save to MongoDB
            await newBannerPicture.save();

            // Send success response
            return res.status(201).json({
                message: "Banner image uploaded successfully.",
                picture: newBannerPicture,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

export const getPictures = asyncHandler(async (req, res) => {
    try {
        const { category, type, page = 1, limit = 6 } = req.query;

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
            if (type === "both") {
                query.$or = [{ type: "auction" }, { type: "homePage" }];
            } else if (type === "bannerImage") {
                query.isBannerImage = true;
            }
            else if (type === "exceptBannerImage") {
                query.$or = [
                    { isBannerImage: false },
                    { isBannerImage: { $exists: false } }
                ];
            } else {
                query.$or = [{ type: type }, { type: "both" }];
            }
        }

        // Pagination logic
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalItems = await Picture.countDocuments(query);
        const pictures = await Picture.find(query)
            .populate('category')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));


        return res.status(200).json({
            data: pictures,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalItems / limit),
        });
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
        if (isPictureDeleted?.type === "auction") {
            await Auction.findOneAndDelete({ picture: id })
        }

        return res.status(200).json({ message: "Picture deleted successfully" })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
})
