import express from "express";
const router = express.Router();

import { protect } from "../middleware/authMiddleware.js";
import {
  deleteAComment,
  deleteACommentToMyPost,
  getLatestPosts,
  likeAPost,
  postAComment,
} from "../controllers/postsController.js";

// Like/Dislike a post
router.route("/like").post(protect, likeAPost);

// Get latest posts in the feed
router.route("/get-latest-posts").get(protect, getLatestPosts);

// Add a comment
router.route("/post-comment").post(protect, postAComment);

//Delete a comment added by user
router.route("/delete-comment/:id").delete(protect, deleteAComment);

//Delete a comment posted by other user to their post
router
  .route("/delete-comment-to-my-post")
  .delete(protect, deleteACommentToMyPost);

export default router;
