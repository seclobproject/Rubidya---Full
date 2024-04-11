import asyncHandler from "../middleware/asyncHandler.js";
import Media from "../models/mediaModel.js";

import User from "../models/userModel.js";

export const likeAPost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.body;

  // Update post by adding userId to likedBy and increment likeCount by one. Also dislike if already liked
  const post = await Media.findById(postId);

  if (post) {
    if (post.likedBy.includes(userId)) {
      const updatePost = await Media.findByIdAndUpdate(
        postId,
        {
          $pull: { likedBy: userId },
          $inc: { likeCount: -1 },
        },
        { new: true }
      );

      // Update user by removing postId from likedPosts
      if (updatePost) {
        const updateUser = await User.findByIdAndUpdate(
          userId,
          {
            $pull: { likedPosts: postId },
          },
          { new: true }
        );
      } else {
        res.status(400).json({
          status: "00",
          msg: "Error liking the post",
        });
      }
    } else {
      const updatePost = await Media.findByIdAndUpdate(
        postId,
        {
          $push: { likedBy: userId },
          $inc: { likeCount: 1 },
        },
        { new: true }
      );

      // Update user by adding postId to likedPosts
      if (updatePost) {
        const updateUser = await User.findByIdAndUpdate(
          userId,
          {
            $push: { likedPosts: postId },
          },
          { new: true }
        );
      } else {
        res.status(400).json({
          status: "00",
          msg: "Error liking the post",
        });
      }
    }
  } else {
    res.status(400).json({
      status: "00",
      msg: "Cannot find the post",
    });
  }
});

// Get latest posts of following user
export const getLatestPosts = asyncHandler(async (req, res) => {
  // Fetch the posts posted by following users
  const userId = req.user._id;
  const following = await User.findById(userId).populate({
    path: "following",
    select: "_id",
  });

  const posts = await Media.find({
    userId: { $in: following.following },
  })
    .sort({ createdAt: -1 })
    .limit(10);

  // Send username along with each post
  let results = [];

  if (posts) {
    for (let i = 0; i < posts.length; i++) {
      const user = await User.findById(posts[i].userId);
      posts[i].username = user.firstName + " " + user.lastName;

      // Check if the user is already liked the post
      if (posts[i].likedBy.includes(userId)) {
        posts[i].isLiked = true;
      } else {
        posts[i].isLiked = false;
      }

      results.push({ ...posts[i]._doc, username: posts[i].username, isLiked: posts[i].isLiked });
    }
  }

  if (posts) {
    res.status(200).json({
      status: "01",
      msg: "Success",
      posts: results,
    });
  } else {
    res.status(404).json({
      status: "00",
      msg: "No posts found",
    });
  }
});
