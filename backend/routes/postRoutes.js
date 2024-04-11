import express from "express";
const router = express.Router();

import { protect } from "../middleware/authMiddleware.js";
import { getLatestPosts, likeAPost,postAComment } from "../controllers/postsController.js";

// Like/Dislike a post
router.route('/like').post(protect, likeAPost);

// Get latest posts in the feed
router.route("/get-latest-posts").get(protect, getLatestPosts);

// Add a comment
router.route("/post-comment").post(protect, postAComment);

export default router;
