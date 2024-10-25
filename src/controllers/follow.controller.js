import asyncHandler from "express-async-handler";
import User from "../models/user.model.js"
import Follow from "../models/follow.model.js"
export const followUser = asyncHandler(async (req, res) => {
    const { userIdToFollow } = req.body;
    const followerId = req.user._id;

    try {
        // Check if the user to follow exists
        const userToFollow = await User.findById(userIdToFollow);
        if (!userToFollow) {
            return res.status(404).json({ message: "User to follow not found" });
        }

        // Prevent users from following themselves
        if (userIdToFollow.toString() === followerId.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({ follower: followerId, following: userIdToFollow });
        if (existingFollow) {
            return res.status(400).json({ message: "You are already following this user" });
        }

        // Create a new follow document
        const newFollow = new Follow({
            follower: followerId,
            following: userIdToFollow,
        });
        await newFollow.save();

        return res.status(201).json({ message: `You Followed ${userToFollow?.fullname}`, data: newFollow });
    } catch (error) {

        res.status(500).json({ message: "Failed to follow user", error: error.message });
    }
});