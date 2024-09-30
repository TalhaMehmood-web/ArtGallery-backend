import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    commentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    replies: [
        {
            text: { type: String, required: true },
            repliedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now, // Timestamp for when the reply was created
            },
        }
    ]
}, {
    timestamps: true
});

// Add default empty array for replies
commentSchema.path('replies').default(() => []);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
