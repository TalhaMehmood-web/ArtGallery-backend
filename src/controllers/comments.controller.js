import asyncHandler from "express-async-handler";
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";

export const createComment = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const { postId } = req.params;
    const userId = req.user._id;

    try {
        // Find the post to which the comment is being added
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Create the new comment
        const newComment = new Comment({
            text,
            commentedBy: userId,
            post: postId,
        });

        // Save the comment
        const savedComment = await newComment.save();
        if (!savedComment) {
            return res.status(500).json({ message: 'Failed to save comment' });
        }

        // Add the comment ID to the post's comments array
        post.comments.push(savedComment._id);

        // Save the updated post
        const updatedPost = await post.save();
        if (!updatedPost) {
            return res.status(500).json({ message: 'Failed to update post with new comment' });
        }

        res.status(201).json({ message: 'Comment added successfully', comment: savedComment });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: error.message });
    }
});


export const getComments = asyncHandler(async (req, res) => {
    const { postId } = req.params; // Get the postId from the request parameters

    try {
        // Find comments related to the specific postId
        const comments = await Comment.find({ post: postId })
            .populate({
                path: "commentedBy",
                select: "fullname email _id username profile", // Only selecting specific fields from the User model
            })
            .lean()
            .exec();

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch comments", error: error.message });
    }
});

