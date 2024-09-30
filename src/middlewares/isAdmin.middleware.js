import User from "../models/user.model.js"
import jwt from "jsonwebtoken";

const isAdmin = async (req, res, next) => {
    try {

        const token = req.cookies?.accessToken || req.headers?.Authorization?.split(" ")[1] || req.headers?.authorization?.split(" ")[1];

        if (!token) {

            return res.status(401).json("Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -accessToken");

        if (!user.isAdmin) {

            return res.status(401).json("Your are not an admin You cannot access this data");
        }

        req.isAdmin = user.isAdmin;
        next();
    } catch (error) {

        res.status(401).json({ message: error?.message || "Invalid access token" });
    }
};

export default isAdmin;
