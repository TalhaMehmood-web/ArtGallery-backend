import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import Picture from "../models/pictures.model.js";
import Auction from "../models/auction.model.js";
import User from "../models/user.model.js"
// Create an auction
export const createAuction = asyncHandler(async (req, res) => {
    try {
        const { pictureId, startDate, endDate } = req.body;

        // Validate the input
        if (!pictureId || !startDate || !endDate) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if picture exists
        const picture = await Picture.findById(pictureId);
        if (!picture) {
            return res.status(404).json({ message: "Picture not found." });
        }
        const findAuction = await Auction.findOne({ picture: pictureId })
        if (findAuction) {
            return res.status(400).json({ message: "Picture is already placed in Auction " });
        }
        // Create the auction
        const auction = new Auction({
            picture: pictureId,
            startingBid: picture.price,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        await auction.save();
        res.status(201).json({ message: "Auction created successfully.", auction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
})

// Controller to get all auctions with populated picture details
export const getAllAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find().populate({
            path: "picture",
            select: "_id title description price picture",
            populate: {
                path: 'category',
                select: 'name'
            }
        }).sort({ createdAt: -1 })

        return res.status(200).json(auctions);
    } catch (error) {

        return res.status(500).json({

            message: error.message
        });
    }
};
export const addBid = async (req, res) => {
    const { auctionId } = req.params;
    const { bidAmount } = req.body;
    const userId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the auction by ID
        const auction = await Auction.findById(auctionId)
            .populate("bids.bidder")
            .session(session);

        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Check if the auction has ended
        const currentTime = new Date();
        if (auction.endDate <= currentTime) {
            await session.abortTransaction(); // Abort transaction in case of failure
            session.endSession();
            return res.status(400).json({ message: "Auction has already ended" });
        }

        // Recheck the current highest bid in a transaction
        const highestBid = auction.bids.length
            ? Math.max(...auction.bids.map((bid) => bid.amount))
            : auction.startingBid;

        // Check if the new bid is higher than the highest bid
        if (bidAmount <= highestBid) {
            await session.abortTransaction(); // Abort transaction in case of failure
            session.endSession();
            return res.status(400).json({
                message: `Bid amount must be higher than the current highest bid of $${highestBid}`,
            });
        }

        // Check if a bid with the same amount already exists (from any user)
        const existingSameAmountBid = auction.bids.find((bid) => bid.amount === bidAmount);
        if (existingSameAmountBid) {
            await session.abortTransaction(); // Abort transaction in case of failure
            session.endSession();
            return res.status(400).json({
                message: "A bid with the same amount already exists. Please place a higher bid.",
            });
        }

        // Check if the user has already placed a bid on the auction
        const existingUserBid = auction.bids.find((bid) => bid.bidder._id.toString() === userId.toString());

        // If the user already has a bid, update the bid amount
        if (existingUserBid) {
            if (bidAmount <= existingUserBid.amount) {
                await session.abortTransaction(); // Abort transaction in case of failure
                session.endSession();
                return res.status(400).json({
                    message: `Your new bid must be higher than your previous bid of $${existingUserBid.amount}`,
                });
            }
            // Update the existing bid with the new amount
            existingUserBid.amount = bidAmount;
        } else {
            // Add a new bid if the user has not bid before
            const newBid = {
                bidder: userId,
                amount: bidAmount,
            };
            auction.bids.push(newBid);
        }

        // Save the auction with the updated or new bid
        await auction.save({ session });

        // Commit the transaction after saving
        await session.commitTransaction();
        session.endSession();

        res.status(200).json(auction);
    } catch (error) {
        await session.abortTransaction(); // Abort transaction in case of error
        session.endSession();
        res.status(500).json({
            message: error.message,
        });
    }
};
export const getBidsAndHighestBidder = async (req, res) => {
    try {
        const { auctionId } = req.params;

        // Fetch the auction and populate the bidder (User) details for each bid
        const auction = await Auction.findById(auctionId)
            .populate('bids.bidder', 'fullname email username') // Populating user information
            .exec();

        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // All bids sorted in descending order by bid amount
        let allBids = auction.bids.sort((a, b) => b.amount - a.amount);

        // Extract the highest bidder (first one after sorting)
        const highestBid = allBids.length > 0 ? allBids[0] : null;
        allBids = allBids.filter(bid => bid?._id !== highestBid?._id)
        return res.json({
            allBids, // Array of all bids with populated user details
            highestBid // The highest bid object with populated bidder
        });
    } catch (error) {
        console.error("Error fetching auction bids:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
export const allBids = asyncHandler(async (req, res) => {
    try {
        // Fetch all auctions, sort by createdAt, and populate the necessary fields
        const auctions = await Auction.find({})
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .populate({
                path: 'bids.bidder',
                select: '_id fullname email username profile', // Only select relevant fields from the user
            })
            .populate({
                path: 'picture', // Assuming this references the picture object
                select: 'picture', // Assuming the picture model has a 'url' field for the image URL
            });

        // Process each auction to add additional computed fields
        const processedAuctions = auctions.map(auction => {
            const bids = auction.bids || [];

            // Calculate the highest bid and highest bidder
            const highestBid = bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : null;
            const highestBidder = bids.length > 0 ? bids.find(bid => bid.amount === highestBid) : null;

            return {
                _id: auction._id,
                startDate: auction.startDate,
                endDate: auction.endDate,
                startingBid: auction.startingBid,
                numberOfBidders: bids.length, // Count the number of bidders
                highestBid: highestBid, // If no bids, the starting bid is the highest bid
                highestBidderName: highestBidder ? highestBidder.bidder.fullname : null,
                highestBidderEmail: highestBidder ? highestBidder.bidder.email : null,
                otherBids: bids.filter(bid => bid.amount !== highestBid).sort((a, b) => b.amount - a.amount), // Exclude the highest bid from the other bids list
                picture: auction.picture.picture || null, // Picture URL
            };
        });

        // Send the formatted response
        res.status(200).json(processedAuctions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});







