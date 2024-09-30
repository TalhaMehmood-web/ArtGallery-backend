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
        const options = {
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' && "None",

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

        const options = {
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' && "None"
        };
        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({

                _id: user._id, fullname: user.fullname, username: user.username, email: user.email,
                isAdmin: user.isAdmin, profile: user.profile || ""
            });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
})
export const getToken = asyncHandler(async (req, res) => {
    const accessToken = req.cookies?.accessToken || req.headers?.Authorization?.split(" ")[1] || req.headers?.authorization?.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({ message: 'No access token provided' });
    }

    try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if (decoded) {
            const user = await User.findById(decoded._id)
            // Send the user's role back to the frontend
            res.status(200).json({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin,
                profile: user.profile || ""

            });
        }

    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
})

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
        const options = {
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' && "None"
        };
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({ message: `${req.user?.fullName} Logged Out` })
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
        if (user.profile !== "") {
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
