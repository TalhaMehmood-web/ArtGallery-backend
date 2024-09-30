import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema({
    picture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Picture",
        required: true
    },
    startingBid: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    bids: [{
        bidder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User" // assuming you have a User model
        },
        amount: Number,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const Auction = mongoose.model("Auction", auctionSchema);

export default Auction;
