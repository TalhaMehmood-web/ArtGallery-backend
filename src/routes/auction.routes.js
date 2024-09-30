import express from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/isAdmin.middleware.js";
import { addBid, allBids, createAuction, getBidsAndHighestBidder } from "../controllers/auction.controllers.js";
import { getAllAuctions } from "../controllers/auction.controllers.js";

const router = express.Router();
router.post("/", verifyJWT, isAdmin, createAuction)
router.get("/", verifyJWT, getAllAuctions)
router.post("/bid/:auctionId", verifyJWT, addBid)
router.get("/bidders/:auctionId", verifyJWT, getBidsAndHighestBidder)
router.get("/bids", verifyJWT, isAdmin, allBids)
export default router;