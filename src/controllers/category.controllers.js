import Category from "../models/category.model.js";
import asyncHandler from "express-async-handler";

export const addNeCategory = asyncHandler(async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validate input
        if (!name || !description) {
            return res.status(400).json({ message: "Name and description are required" });
        }

        // Check if the category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists" });
        }

        // Create and save the new category
        const newCategory = new Category({
            name,
            description,
        });
        await newCategory.save();

        // Return success response
        res.status(201).json({ message: "Category created successfully", category: newCategory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const getAllCategoryNames = asyncHandler(async (req, res) => {
    try {
        // Fetch all categories and select only the 'name' field
        const categories = await Category.find().select('name');

        // Return the category names
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const deleteCategory = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(400).json({ message: "Error Deleting Category" })
        }
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})