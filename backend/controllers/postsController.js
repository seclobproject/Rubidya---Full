import asyncHandler from "../middleware/asyncHandler.js";
import Media from "../models/mediaModel.js";

import User from "../models/userModel.js";

import Comment from "../models/commentModel.js"

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
  const following = await User.findById(userId).select("_id profilePic").populate({
    path: "following",
    select: "_id",
  }).populate({ path: "profilePic", select: "filePath" })


  const posts = await Media.find({
    userId: { $in: following.following },
  })
    .sort({ createdAt: -1 })
    // .limit(10);

  if (posts) {
    res.status(200).json({
      status: "01",
      msg: "Success",
      posts,
      user:following
    });
  } else {
    res.status(404).json({
      status: "00",
      msg: "No posts found",
     
    });
  }
});

//Post a comment
export const postAComment = asyncHandler(async (req, res) => {

  //Fetching datas of post
  const post = await Media.findById(req.body.mediaId);

  if (post) {

    //Create a record in comment table
    const createComment = await Comment.create({
      userId: req.user._id,
      comment: req.body.comment,
      mediaId: req.body.mediaId
    });

    if (createComment) {

      //Fetching commentId
      let commentId = createComment._id


      //Updating post record by adding the commentId and by incrementing comment count
      const updatePost = await Media.findByIdAndUpdate(
        req.body.mediaId, {
        $push: { commentId: commentId },
        $inc: { commentCount: 1 },
      },
        { new: true }

      )

      res.status(200).json({ sts: "01", msg: "Comment Posted successfully", comment: createComment });
    }
    else {
      res.status(400).json({
        status: "00",
        msg: "Cannot post comment",
      });
    }
  } else {
    res.status(400).json({
      status: "00",
      msg: "Cannot find the post",
    });
  }

});

//Delete a comment posted by user
export const deleteAComment = asyncHandler(async (req, res) => {

  const commentId = req.params.id;

  //Fetching datas of comment
  const comment = await Comment.findById(commentId);

  if (comment) {

    //Fetching data of media 
    const media = await Media.findById(comment.mediaId);

    //Checking if commentId of media includes commentId provided
    if (media.commentId.includes(commentId)) {

      //Updating record of media by removing commentId and decrementing commentcount
      const updateMedia = await Media.findByIdAndUpdate(
        comment.mediaId,
        {
          $pull: { commentId: commentId },
          $inc: { commentCount: -1 },
        },
        { new: true }
      );
      //Deleting comment record
      const deletedMedia = await Comment.findByIdAndDelete(commentId)

      res.status(200).json({ message: 'Comment deleted successfully' });
    } else {
      return res.status(404).json({ error: 'No such comment found for the post ' });
    }
  } else {
    return res.status(404).json({ error: 'No comment found' });
  }
});

//User deletes a comment posted by other user to their post
export const deleteACommentToMyPost = asyncHandler(async (req, res) => {

  //Fetching commentId and mediaId
  const commentId = req.body.commentId;
  const mediaId = req.body.mediaId;

  //Fetching datas of comment
  const comment = await Comment.findById(commentId);

  if (comment) {

    //Fetching datas of media 
    const media = await Media.findById(mediaId);

    //Checking if commentId of media includes commentId provided  
    if (media.commentId.includes(commentId)) {

      //Updating record of media by removing commentId and decrementing commentcount
      const updateMedia = await Media.findByIdAndUpdate(
        comment.mediaId,
        {
          $pull: { commentId: commentId },
          $inc: { commentCount: -1 },
        },
        { new: true }
      );
      //Deleting comment record
      const deletedMedia = await Comment.findByIdAndDelete(commentId)

      res.status(200).json({ message: 'Comment deleted successfully' });
    } else {
      return res.status(404).json({ error: 'No such comment found for the post ' });
    }
  } else {
    return res.status(404).json({ error: 'No comment found' });
  }
});
