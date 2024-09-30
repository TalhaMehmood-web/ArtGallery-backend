import mongoose from "mongoose";
import User from "./user.model.js";
import Category from "./category.model.js";
const pictureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    picture: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Category,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true

    }
}, {
    timestamps: true,
});

const Picture = mongoose.model("Picture", pictureSchema);

export default Picture;
