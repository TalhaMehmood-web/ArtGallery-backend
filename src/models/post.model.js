import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    picture: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: []
        },
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: []
        },
    ],
    hashTags: {
        type: Array,
        default: [],
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

export default Post;
