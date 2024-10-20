import mongoose from "mongoose";
import User from "./user.model.js";
import Category from "./category.model.js";

const pictureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: function () {
            return !this.isBannerImage; // Only required if not a banner image
        },
    },
    picture: {
        type: String,
        required: true, // Picture is always required
    },
    description: {
        type: String,
        required: function () {
            return !this.isBannerImage; // Only required if not a banner image
        },
    },
    price: {
        type: String,
        required: function () {
            return !this.isBannerImage; // Only required if not a banner image
        },
    },
    type: {
        type: String,
        required: function () {
            return !this.isBannerImage; // Only required if not a banner image
        },
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Category,
        required: function () {
            return !this.isBannerImage; // Only required if not a banner image
        },
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
    },
    isBannerImage: {
        type: Boolean,
        default: false,
        required: true,
    },
}, {
    timestamps: true,
});

// Pre-save hook to remove unnecessary fields for banner images
pictureSchema.pre('save', function (next) {
    if (this.isBannerImage) {
        // Unset the non-banner fields if it's a banner image
        this.title = undefined;
        this.description = undefined;
        this.price = undefined;
        this.type = undefined;
        this.category = undefined;
    }
    next();
});

const Picture = mongoose.model("Picture", pictureSchema);

export default Picture;
