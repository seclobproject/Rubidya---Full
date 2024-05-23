import asyncHandler from "../middleware/asyncHandler.js";
import Media from "../models/mediaModel.js";

import User from "../models/userModel.js";
import Comment from "../models/commentModel.js";

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

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5; // Default page size to 5 if not provided

  // Calculate the skip value
  const skip = (page - 1) * limit;

  // let posts = await Media.find({
  //   userId: { $in: following.following },
  // })
  //   .populate({ path: "commentId", select: "comment" })
  //   .sort({ createdAt: -1 });
  // .limit(10);

  let posts = await Media.find({
    userId: { $in: following.following },
  })
    .populate({ path: "commentId", model: Comment, select: "comment userId createdAt ", populate: { path: "userId", select: "firstName  lastName", populate: { path: "profilePic", select: "filePath" } } })
    .sort({ createdAt: -1 })

  let postCount = posts.length

  // Paginate the posts
  posts = posts.slice(skip, skip + limit);

  // Send username along with each post
  let results = [];
  if (posts) {
    for (let i = 0; i < posts.length; i++) {


      const user = await User.findById(posts[i].userId).populate({ path: "profilePic", select: "filePath" });

      posts[i].username = user.firstName + " " + user.lastName;
      // Check if the user is already liked the post
      if (posts[i].likedBy.includes(userId)) {
        posts[i].isLiked = true;
      } else {
        posts[i].isLiked = false;
      }


      // Fetch the last person who liked the post
      const lastLikedUserId = posts[i].likedBy[posts[i].likedBy.length - 1];
      if (lastLikedUserId) {
        const lastLikedUser = await User.findById(lastLikedUserId);
        posts[i].lastLikedUserName = lastLikedUser.firstName + " " + lastLikedUser.lastName;
      } else {
        posts[i].lastLikedUserName = null;
      }

      //Fetch the last person who commented the post

      const lastCommentId = posts[i].commentId[posts[i].commentId.length - 1];
      if (lastCommentId) {

        const lastComment = await Comment.findById(lastCommentId);

        if (lastComment) {

          const lastCommentedUser = await User.findById(lastComment.userId)
          posts[i].lastCommentedUser = lastCommentedUser.firstName + " " + lastCommentedUser.lastName;
        } else {
          posts[i].lastCommentedUser = null;
        }

      } else {
        posts[i].lastCommentedUser = null;
      }

      results.push({
        ...posts[i]._doc,
        username: posts[i].username,
        isLiked: posts[i].isLiked,
        profilePic: user.profilePic ? user.profilePic.filePath : null,
        lastLikedUserName: posts[i].lastLikedUserName,
        lastCommentedUser: posts[i].lastCommentedUser
      });
    }
  }
  if (posts) {
    res.status(200).json({
      status: "01",
      msg: "Success",
      posts: results,
      postCount:postCount
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
      mediaId: req.body.mediaId,
    });

    if (createComment) {
      //Fetching commentId
      let commentId = createComment._id;

      //Updating post record by adding the commentId and by incrementing comment count
      const updatePost = await Media.findByIdAndUpdate(
        req.body.mediaId,
        {
          $push: { commentId: commentId },
          $inc: { commentCount: 1 },
        },
        { new: true }
      );

      res
        .status(200)
        .json({
          sts: "01",
          msg: "Comment Posted successfully",
          comment: createComment,
        });
    } else {
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
      const deletedMedia = await Comment.findByIdAndDelete(commentId);

      res.status(200).json({ message: "Comment deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ error: "No such comment found for the post " });
    }
  } else {
    return res.status(404).json({ error: "No comment found" });
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
      const deletedMedia = await Comment.findByIdAndDelete(commentId);

      res.status(200).json({ message: "Comment deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ error: "No such comment found for the post " });
    }
  } else {
    return res.status(404).json({ error: "No comment found" });
  }
});

//Get details of liked users 
export const getLikesOfAPost = asyncHandler(async (req, res) => {

  const userId = req.user._id;

  const postId = req.params.postId;

  // Fetch the details liked users of a post
  let posts = await Media.findById(postId)
    .populate({ path: "likedBy", select: "firstName lastName " });

  if (posts) {

    //Fetching details of user
    let user = await User.findById(userId)

    let likedBy = posts.likedBy

    //Remove the user with the specified ID from the likedBy array
    likedBy = likedBy.filter(user => user._id.toString() != userId);

    let results = [];
    let isFollowing;

    //Looping through the likedBy details
    for (const like of likedBy) {

      //Checking if user if following the liked user
      if (user.followers.includes(like._id)) {
        isFollowing = true
      } else {
        isFollowing = false
      }

      results.push({
        ...like._doc,
        isFollowing: isFollowing
      });
    }

    res.status(200).json({
      status: "01",
      msg: "Success",
      results
    });

  } else {
    res.status(404).json({
      status: "00",
      msg: "No posts found",
    });
  }

});


