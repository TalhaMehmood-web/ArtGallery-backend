import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import validator from "validator";
import bcrypt from "bcryptjs";
import generateAccessAndRefreshTokens from "../utils/generateToken.js";
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { getPictureName } from "../utils/getPictureName.js";
import Post from "../models/post.model.js";
import Auction from "../models/auction.model.js"

dotenv.config();
export const register = asyncHandler(async (req, res) => {

    const { fullname, email, username, password } = req.body
    try {
        if (!fullname || !email || !username || !password) {
            return res.status(400).json({ message: "Please fill all the fields" })
        }
        if (!req.file) {
            return res.status(400).json({ message: "Profile Picture is required" });
        }

        const cloudinaryResponse = await uploadOnCloudinary(req.file?.path);

        if (!cloudinaryResponse) {
            return res.status(500).json({ message: "Failed to upload image to Cloudinary." });
        }
        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return res.status(400).json({ message: "email already exists" })
        }

        const findByUsername = await User.findOne({ username })
        if (findByUsername) {
            return res.status(400).json({ message: "username already exists" })
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Email is not a valid email " })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const user = await User.create({

            fullname,
            email,
            username,
            password: hashedPassword,
            profile: cloudinaryResponse?.secure_url || ""

        })
        if (email === process.env.ADMIN_EMAIL) {
            user.isAdmin = true
        }
        await user.save()
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        const isProduction = process.env.NODE_ENV === 'production';

        const options = {
            httpOnly: isProduction,
            secure: true,
            sameSite: isProduction ? 'Strict' : 'None',
            partitioned: true,

        };
        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(user);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
export const login = asyncHandler(async (req, res) => {

    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).json({ message: "email is required" })
        }
        if (!password) {
            return res.status(400).json({ message: "password is required" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(500).json({ message: "User not found!!!" })
        }

        const matchedPassword = await bcrypt.compare(password, user.password);
        if (!matchedPassword) {
            return res.status(400).json({ message: "Incorrect Password" })
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: isProduction ? 'Strict' : 'Lax',
            partitioned: isProduction

        };
        res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            isAdmin: user.isAdmin,
            profile: user?.profile
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
})
export const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded._id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const accessToken = generateToken(user._id, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRY);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
            maxAge: 24 * 60 * 60 * 1000,  // 1 day
        });

        res.status(200).json({ accessToken });
    } catch (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
});


export const logoutUser = asyncHandler(async (req, res) => {
    try {

        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        )
        const isProduction = process.env.NODE_ENV === 'production';

        const cookieOptions = {
            httpOnly: true,                            // Always httpOnly for security
            secure: true,                      // Secure in production (HTTPS only)
            sameSite: isProduction ? 'Strict' : 'Lax',
            partitioned: isProduction

        };
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message })
    }
})
export const editProfile = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        const { fullname, email, username } = req.body;
        let newUploadedPic;
        if (user.profile) {
            try {
                await deleteFromCloudinary(getPictureName(user.profile));
            } catch (error) {
                return res.status(500).json({ message: "Failed to delete old picture" });
            }
        }

        // Upload new profile picture if provided
        if (req.file && req.file.path) {
            try {
                const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
                newUploadedPic = cloudinaryResponse?.secure_url;
            } catch (error) {
                return res.status(500).json({ message: "Failed to upload new picture" });
            }
        }

        // Prepare update object


        // Update user in the database
        const updatedUser = await User.findByIdAndUpdate(user._id, {
            fullname, username, email, profile: newUploadedPic
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found or failed to update" });
        }

        // Respond with updated user info
        res.status(200).json({
            _id: updatedUser._id,
            fullname: updatedUser.fullname,
            email: updatedUser.email,
            username: updatedUser.username,
            profile: updatedUser.profile,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const userProfileAnalytics = asyncHandler(async (req, res) => {
    try {
        const user = req.user;

        // Find all posts created by the user and populate likedBy details
        const posts = await Post.find({ postedBy: user._id })
            .populate({
                path: 'likes', // Assuming 'likes' contains the user IDs of those who liked the post
                select: 'fullname profile _id email ', // Select the fields to return from the liked users
            });

        // Calculate the total number of likes across all posts
        const totalNumberOfLikes = posts.reduce((acc, post) => acc + post.likes.length, 0);

        // Format the posts data as required
        const formattedPosts = posts.map((post) => ({
            _id: post._id,
            numberOfPosts: posts.length, // Total posts created by the user
            picture: post.picture,
            createdAt: post.createdAt,
            likedBy: post.likes.map((like) => ({
                _id: like._id,
                profile: like.profile,
                fullname: like.fullname,
                email: like.email
            }))
        }));

        // Find all auctions where the user's ID matches any bidder in the 'bids' array
        const auctions = await Auction.find({
            bids: {
                $elemMatch: { bidder: user._id }
            }
        }).populate({
            path: "picture",
            select: "picture _id title"
        }).populate({
            path: 'bids.bidder',
            select: 'fullname profile' // Populate bidder details
        });

        // Find the number of auctions where the user is the highest bidder
        const numberOfHighestBids = auctions.reduce((acc, auction) => {
            // Find the highest bid in the auction
            const highestBid = auction.bids.reduce((max, bid) => {
                return bid.amount > max.amount ? bid : max;
            }, { amount: 0 });

            // Check if the user is the highest bidder
            return highestBid.bidder._id.toString() === user._id.toString() ? acc + 1 : acc;
        }, 0);

        // Format the auctions data
        const formattedAuctions = auctions.map(auction => {
            // Find the highest bid in the auction
            const highestBid = auction.bids.reduce((max, bid) => {
                return bid.amount > max.amount ? bid : max;
            }, { amount: 0 });

            // Check if the user is the highest bidder
            const isHighestBidder = highestBid.bidder._id.toString() === user._id.toString();

            // Get the remaining bidders excluding the user
            const remainingBidders = auction.bids.filter(bid => bid.bidder._id.toString() !== user._id.toString());

            return {
                _id: auction._id,
                title: auction.picture.title,
                picture: auction.picture.picture,
                startingBid: auction.startingBid, // Picture of the auction item
                isHighestBidder,
                highestBidAmount: highestBid.amount, // Highest bid amount placed in the auction
                highestBidderName: highestBid.bidder.fullname,
                highestBidderPicture: highestBid.bidder.profile,
                remainingBidders: remainingBidders.length // Total number of bidders excluding the user
            };
        });

        // Respond with the data in the required format
        return res.status(200).json({
            message: "User profile analytics fetched successfully",
            posts: {
                items: formattedPosts, // Formatted posts array
                totalNumberOfLikes // Total likes from all posts
            },
            auctions: {
                numberOfHighestBids, // Total number of auctions where the user is the highest bidder
                items: formattedAuctions // Formatted auction items array
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});





