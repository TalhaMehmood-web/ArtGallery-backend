import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const followSchema = new Schema({
    follower: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    following: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    followedAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure a user cannot follow the same person twice
followSchema.index({ follower: 1, following: 1 }, { unique: true });

export default model('Follow', followSchema);
