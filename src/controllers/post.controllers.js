import asyncHandler from "express-async-handler";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Post from "../models/post.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { getPictureName } from "../utils/getPictureName.js";
export const createPost = asyncHandler(async (req, res) => {
    try {
        const { description, hashTags, title } = req.body;
        const postedBy = req.user._id;

        // If no file is provided, return an error
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const cloudinaryResponse = await uploadOnCloudinary(req.file?.path);

        if (!cloudinaryResponse) {
            return res.status(500).json({ message: "Failed to upload image to Cloudinary." });
        }

        // Create a new post
        const newPost = new Post({
            title,
            description,
            picture: cloudinaryResponse.secure_url || "", // Cloudinary secure URL
            hashTags: hashTags.split(','), // Assuming hashTags is a comma-separated string
            postedBy,
        });

        // Save the post to the database
        const savedPost = await newPost.save();

        // Return the saved post
        res.status(201).json({
            message: "Post created successfully",
            post: savedPost,
        });
    } catch (error) {
        // Handle any errors that occur during the process
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
export const getPosts = asyncHandler(async (req, res) => {
    try {
        const posts = await Post.find({})
            .populate({
                path: "comments",
                populate: {
                    path: "commentedBy",
                    select: "fullname email username _id profile" // Select fields from the 'User' model for the commentedBy field
                },
            })
            .populate({
                path: 'postedBy',
                select: 'fullname email _id profile username' // Select fields you want from the 'User' model
            })
            .sort({ createdAt: -1 })
            .lean() // To return plain JavaScript objects instead of Mongoose documents
            .exec();


        const formattedPosts = posts.map(post => ({
            _id: post._id,
            title: post.title,
            picture: post.picture,
            description: post.description,
            likes: post.likes,
            numberOfComments: post.comments.length,
            comments: post.comments, // Calculate the number of comments
            hashTags: post.hashTags,
            postedBy: post.postedBy, // Populated postedBy field
            createdAt: post.createdAt
        }));

        res.status(200).json(formattedPosts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch posts", error: error.message });
    }
});


// Toggle like for a post
export const toggleLikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id; // Assuming user ID is available from the auth middleware

        const post = await Post.findById(postId).populate({
            path: "comments",
            populate: {
                path: "commentedBy",
                select: "fullname email username _id profile" // Select fields from the 'User' model for the commentedBy field
            },
        })
            .populate({
                path: 'postedBy',
                select: 'fullname email _id profile username' // Select fields you want from the 'User' model
            });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user has already liked the post
        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            // Remove like
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {
            // Add like
            post.likes.push(userId);
        }

        await post.save();
        res.json({ message: hasLiked ? "Post unliked" : "Post liked", likes: post.likes.length, post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const deletePost = asyncHandler(async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;


        const post = await Post.findOne({ _id: postId, postedBy: userId });
        if (!post) {
            return res.status(404).json({ message: "Post not found or you do not have permission to delete this post" });
        }
        const pictureName = getPictureName(post?.picture)
        if (pictureName) {
            await deleteFromCloudinary(pictureName)
        }




        await Post.deleteOne({ _id: postId });

        res.status(200).json({ message: "Post deleted successfully from our server" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
