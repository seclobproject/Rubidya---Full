import asyncHandler from "../middleware/asyncHandler.js";
import Media from "../models/mediaModel.js";
import Comment from "../models/commentModel.js";
import User from "../models/userModel.js";

import Point from "../models/pointModel.js";
import moment from "moment";
import mongoose from "mongoose";
import axios from "axios";
import moments from 'moment-timezone';

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

        if (updateUser) {
          res.status(200).json({
            status: "01",
          });
        }
      } else {
        res.status(400).json({
          status: "00",
          msg: "Error in dis liking the post",
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



        let record;


        // Get the start and end of today
        //const startOfToday = new Date();
        //startOfToday.setHours(0, 0, 0, 0);

        //const endOfToday = new Date();
        //endOfToday.setHours(23, 59, 59, 999);

        const startOfDayIST = moments.tz('Asia/Kolkata').startOf('day');
        const endOfDayIST = moments.tz('Asia/Kolkata').endOf('day');
        // Convert the start and end times to UTC
        const startOfToday = startOfDayIST.clone().tz('UTC').toDate();
        const endOfToday = endOfDayIST.clone().tz('UTC').toDate();

        // Check if the post was created today
        if (post.createdAt >= startOfToday && post.createdAt < endOfToday) {
          // Find the earliest post created by the user today
          const firstPostToday = await Media.findOne({
            userId: post.userId,
            createdAt: {
              $gte: startOfToday,
              $lt: endOfToday
            }
          }).sort({ createdAt: 1 }); // Sort by creation date in ascending order


          //Fetching point data
          record = await Point.findOne({
            mediaId: req.body.postId,
            userId: req.user._id,
            pointType: 'like'
          });

          if (!record && firstPostToday && firstPostToday._id.equals(post._id) && !userId.equals(post.userId)) {

            //Create a record in point table,that is owner of the first post of each day will get 5 points for each like
            const point = await Point.create({
              userId: post.userId,
              point: 5,
              pointType: 'first_post_like',
              mediaId: req.body.postId

            });

          }
        }

        record = await Point.findOne({
          mediaId: req.body.postId,
          userId: req.user._id,
          pointType: 'like'
        });


        if (!record && !userId.equals(post.userId)) {

          //Create a record in point table,that is user who likes post will get 1 point for each like
          const points = await Point.create({
            userId: req.user._id,
            point: 1,
            pointType: 'like',
            mediaId: req.body.postId

          });

        }

        if (updateUser) {
          res.status(200).json({
            status: "01",
          });
        }
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
  const limit = parseInt(req.query.limit) || 5; // Default page size to 10 if not provided


  // Calculate the skip value
  const skip = (page - 1) * limit;

  //let posts = await Media.find({
  //userId: { $in: following.following },
  //})
  //.populate({ path: "commentId", model: Comment, select: "comment" })
  //.sort({ createdAt: -1 });
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
        profilePic: user.profilePic ? user.profilePic : null,
        isLiked: posts[i].isLiked, profilePic: user.profilePic ? user.profilePic.filePath : null,
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
      postCount: postCount
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



      let record;


      // Get the start and end of today
      //const startOfToday = new Date();
      //startOfToday.setHours(0, 0, 0, 0);

      //const endOfToday = new Date();
      //endOfToday.setHours(23, 59, 59, 999);




      const startOfDayIST = moments.tz('Asia/Kolkata').startOf('day');
      const endOfDayIST = moments.tz('Asia/Kolkata').endOf('day');
      // Convert the start and end times to UTC
      const startOfToday = startOfDayIST.clone().tz('UTC').toDate();
      const endOfToday = endOfDayIST.clone().tz('UTC').toDate();



      if (post.createdAt >= startOfToday && post.createdAt < endOfToday) {

        // Find the earliest post created by the user today
        const firstPostToday = await Media.findOne({
          userId: post.userId,
          createdAt: {
            $gte: startOfToday,
            $lt: endOfToday
          }
        }).sort({ createdAt: 1 }); // Sort by creation date in ascending order

        //Fetching data of point table

        record = await Point.findOne({
          mediaId: req.body.mediaId,
          userId: req.user._id,
          pointType: 'comment'
        });

        if (!record && firstPostToday._id.equals(post._id) && !createComment.userId.equals(post.userId)) {

          //Create a record in point table,that is owner of the first post of each day get 5 points for each comment to post
          const point = await Point.create({
            userId: post.userId,
            point: 5,
            pointType: 'first_post_comment',
            mediaId: req.body.mediaId

          });

        }

      }

      //Fetching datas of point table
      record = await Point.findOne({
        mediaId: req.body.mediaId,
        userId: req.user._id,
        pointType: 'comment'
      });


      if (!record && !createComment.userId.equals(post.userId)) {

        //Create a record in point table,that is user who post comment will get 1 point for each comment to a post
        const points = await Point.create({
          userId: req.user._id,
          point: 1,
          pointType: 'comment',
          mediaId: req.body.mediaId

        });
      }



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
  let userId = req.user._id

  //Fetching datas of comment
  const comment = await Comment.findById(commentId);

  if (comment) {
    //Fetching datas of media
    const media = await Media.findById(mediaId);

    if (userId.equals(media.userId)) {
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
      return res
        .status(404)
        .json({ error: "Only post owner can delete the comments " });
    }
  } else {
    return res.status(404).json({ error: "No comment found" });
  }
});



//Get details of comment of a post
export const getCommentsOfAPost = asyncHandler(async (req, res) => {

  const userId = req.user._id;

  const postId = req.params.postId;

  // Fetch the details comments  of a post
  //let posts = await Media.findById(postId)
  //.populate({ path: "commentId", select: "comment createdAt", populate: { path: "userId", select: "firstName lastName", populate: { path: "profilePic", select: "filePath" } } });


  let posts = await Media.findById(postId)
    .populate({ path: "commentId", select: "comment createdAt likedBy likeCount", populate: [{ path: "userId", select: "firstName lastName", populate: { path: "profilePic", select: "filePath" } }, { path: "replyComment", select: "comment createdAt", populate: { path: "userId", select: "firstName lastName", populate: { path: "profilePic", select: "filePath" } } }] });


  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default page size to 5 if not provided

  // Calculate the skip value
  const skip = (page - 1) * limit;

  if (posts) {

    // Sort comments by createdAt in ascending order
    posts.commentId.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let comments = posts.commentId

    let results = [];

    let commentCount = 0;

    if (comments.length) {

      // Paginate the comments
      comments = comments.slice(skip, skip + limit);
      commentCount = comments.length

      let isMyComment;


      let lastLikedUser;
      let lastCommentedUser;
      let lastComment;
      for (const comment of comments) {

        //Checking if the comment posted by the user or not
        if (comment.userId._id.equals(userId)) {
          isMyComment = true
        } else {
          isMyComment = false
        }



        // Sort reply comments by createdAt in descending order
        if (comment.replyComment && comment.replyComment.length > 0) {
          comment.replyComment.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }


        //Checking if the comment is liked by user or not
        let isLiked;
        if (comment.likedBy.includes(userId)) {
          isLiked = true;
        } else {
          isLiked = false;
        }



        let lastLikedUserName;


        // Fetch the last person who liked the post
        if (comment.likedBy.length > 0) {

          const lastLikedUserId = comment.likedBy[comment.likedBy.length - 1];

          if (lastLikedUserId) {
            lastLikedUser = await User.findById(lastLikedUserId);

            lastLikedUserName = lastLikedUser ? lastLikedUser.firstName + " " + lastLikedUser.lastName : null;

          }

        }

        let lastCommentedUserName;
        if (comment.replyComment.length > 0) {

          const lastCommentId = comment.replyComment[comment.replyComment.length - 1];

          if (lastCommentId) {

            lastComment = await Comment.findById(lastCommentId);

            lastCommentedUser = await User.findById(lastComment.userId);


            lastCommentedUserName = lastCommentedUser ? lastCommentedUser.firstName + " " + lastCommentedUser.lastName : null;

          }

        }

        results.push({
          postId: posts._id,
          fileType: posts.fileType,
          fileName: posts.fileName,
          filePath: posts.filePath,
          description: posts.description,
          likedBy: posts.likedBy,
          likedCount: posts.likedCount,
          commentCount: commentCount,
          comment: comment.comment,
          commentId: comment._id,
          time: comment.createdAt,
          userId: comment.userId._id,
          firstName: comment.userId.firstName,
          lastName: comment.userId.lastName,
          profilePic: comment.userId.profilePic ? comment.userId.profilePic.filePath : null,
          isMyComment: isMyComment,
          replyComment: comment.replyComment ? comment.replyComment : null,
          lastLikedUserName: lastLikedUserName ? lastLikedUserName : null,
          lastCommentedUserName: lastCommentedUserName ? lastCommentedUserName : null,
          likesOfComment: comment.likeCount,
          isLiked: isLiked
        });
      }

      res.status(200).json({
        status: "01",
        msg: "Success",
        results
      });
    } else {
      results.push({
        postId: posts._id,
        fileType: posts.fileType,
        fileName: posts.fileName,
        filePath: posts.filePath,
        description: posts.description,
        likedBy: posts.likedBy,
        likedCount: posts.likedCount,
        commentCount: commentCount

      });
      res.status(200).json({
        status: "01",
        msg: "Success",
        results
      });
    }

  } else {
    res.status(404).json({
      status: "00",
      msg: "No posts found",
    });
  }

});



//Function to reply a comment
export const replyAComment = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const { commentId, comment } = req.body;

  if (!commentId) {

    throw new Error("No comment id found")
  }


  // Update comment by adding userId to likedBy and increment likeCount by one. Also dislike if already liked
  const comments = await Comment.findById(commentId);

  if (comments) {

    //Create a record in comment table for reply comment
    const createComment = await Comment.create({
      userId: req.user._id,
      comment: comment,
      mediaId: comments.mediaId,
    });

    if (createComment) {

      //Update the comment record which got reply
      const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
          $push: { replyComment: createComment._id },
          $inc: { replyCount: 1 },
        },
        { new: true }
      );
      if (updateComment) {
        res.status(200).json({
          status: "01",
          msg: "Reply  comment added successfully "
        });
      }
    }

  } else {
    res.status(400).json({
      status: "00",
      msg: "Cannot find the comment",
    });
  }
});


//Function to like/dislike a comment
export const likeAComment = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const { commentId } = req.body;

  if (!commentId) {

    throw new Error("No comment id found")
  }


  // Update comment by adding userId to likedBy and increment likeCount by one. Also dislike if already liked
  const comment = await Comment.findById(commentId);

  if (comment) {
    if (comment.likedBy.includes(userId)) {

      const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
          $pull: { likedBy: userId },
          $inc: { likeCount: -1 },
        },
        { new: true }
      );

      // Update user by removing commentId from likedComments
      if (updateComment) {
        const updateUser = await User.findByIdAndUpdate(
          userId,
          {
            $pull: { likedComments: commentId },
          },
          { new: true }
        );

        if (updateUser) {
          res.status(200).json({
            status: "01",
          });
        }
      } else {
        res.status(400).json({
          status: "00",
          msg: "Error in disliking the comment",
        });
      }
    } else {

      const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
          $push: { likedBy: userId },
          $inc: { likeCount: 1 },
        },
        { new: true }
      );

      // Update user by adding postId to likedPosts
      if (updateComment) {
        const updateUser = await User.findByIdAndUpdate(
          userId,
          {
            $push: { likedComments: commentId },
          },
          { new: true }
        );

        if (updateUser) {
          res.status(200).json({
            status: "01",
          });
        }
      } else {
        res.status(400).json({
          status: "00",
          msg: "Error liking the comment",
        });
      }
    }
  } else {
    res.status(400).json({
      status: "00",
      msg: "Cannot find the comment",
    });
  }
});



//Get details of  reply of a comment
export const getReplyOfAComment = asyncHandler(async (req, res) => {

  const userId = req.user._id;

  const commentId = req.params.commentId;

  // Fetch the details comments  of a post
  let comment = await Comment.findById(commentId)
    .populate({ path: "replyComment", select: "comment createdAt", populate: { path: "userId", select: "firstName lastName", populate: { path: "profilePic", select: "filePath" } } });


  if (comment) {
    // Sort comments by createdAt in ascending order
    comment.replyComment.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let comments = comment.replyComment;

    let replyComments = [];



    if (comments.length) {

      for (const commentData of comments) {

        replyComments.push({
          replyCommentId: commentData._id,
          replyComment: commentData.comment,
          replyTime: commentData.createdAt,
          repliedUserId: commentData.userId._id,
          repliedUser: commentData.userId.firstName + ' ' + commentData.userId.lastName,
          profilePicture: commentData.userId.profilePic ? commentData.userId.profilePic.filePath : null
        });
      }

      res.status(200).json({
        status: "01",
        msg: "Success",
        result: {
          parentComment: comment.comment,
          parentCommentId: comment._id,
          mediaId: comment.mediaId,
          replyCount: comment.replyCount,
          createdAt: comment.createdAt,
          replyComments
        }
      });
    }
    else {
      res.status(200).json({
        status: "01",
        msg: "Success",
        result: {
          parentComment: comment.comment,
          parentCommentId: comment._id,
          mediaId: comment.mediaId,
          replyCount: comment.replyCount,
          createdAt: comment.createdAt,
          replyComments
        }
      });

    }
  }

  else {
    res.status(404).json({
      status: "00",
      msg: "No comments found",
    });
  }


});

//Function to get most liked posts

export const getMostLovedPosts = asyncHandler(async (req, res) => {


  let media = await Media.find({}).populate({
    path: 'userId',
    populate: {
      path: 'profilePic',
      model: 'ProfilePic' // Adjust the model name if different
    }
  })
    .sort({ likeCount: -1 })
    .limit(100)
    .exec();
  //let media = await Media.find({}).populate("userId").limit(100).sort({ likeCount: -1 })
  // return res.json({
  //   media:media
  // })
  let result = [];
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default page size to 10 if not provided
  // Calculate the skip value
  const skip = (page - 1) * limit;
  if (media) {
    let totalPostCount = media.length;
    // Paginate the media
    media = media.slice(skip, skip + limit);
    for (const mediaData of media) {
      result.push({
        ...mediaData._doc,
        userId: mediaData.userId._id,
        firstName: mediaData.userId.firstName,
        lastName: mediaData.userId.lastName,
        profilePic: mediaData.userId.profilePic ? mediaData.userId.profilePic.filePath : null,
      });
    }
    res
      .status(200)
      .json({ sts: "01", msg: "Success", postCount: totalPostCount, media: result });
  } else {
    res.status(404).json({ sts: "00", msg: "No media found" });
  }
});





const pointTypes = ['comment', 'like', 'follow', 'first_post', 'referal', 'direct_referal', 'team_referal'];






//Function to splitt prize money to top three user
export const thisDayPointsOfTopThreeUsers = asyncHandler(async (req, res) => {

  // const startOfDayUtc = moment().startOf('day').toDate();
  // const endOfDayUtc = moment.utc().endOf('day').toDate();

  //const startOfDay = moment().utc().startOf('day').subtract(5, 'hours').subtract(30, 'minutes').toDate();
  //const endOfDay = moment().utc().endOf('day').subtract(5, 'hours').subtract(30, 'minutes').toDate();

  // Get the start and end of the day in local time
  const startOfDayIST = moments.tz('Asia/Kolkata').startOf('day');
  const endOfDayIST = moments.tz('Asia/Kolkata').endOf('day');

  // Convert the start and end times to UTC
  const startOfDayUTC = startOfDayIST.clone().tz('UTC').toDate();
  const endOfDayUTC = endOfDayIST.clone().tz('UTC').toDate();

  //Aggregation pipe to find top 3 users
  const response = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfDayUTC,
          $lt: endOfDayUTC
        }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalPoints: { $sum: '$point' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $lookup: {
        from: 'profilepics',
        localField: 'user._id',
        foreignField: 'userId', // Match with userId in ProfilePic schema
        as: 'profilePic'
      }
    },
    {
      $unwind: {
        path: '$profilePic',
        preserveNullAndEmptyArrays: true // Left outer join to include all users even if they don't have a profile picture
      }
    },
    {
      $project: {
        userId: '$_id',
        totalPoints: 1,
        userName: '$user.firstName',
        profilePic: {
          $ifNull: ['$profilePic.filePath', null]
        }
      }
    },
    {
      $sort: {
        totalPoints: -1 // Sort by totalPoints in descending order
      }
    },
    {
      $limit: 3 // Limit the result to the top 2 users
    }
  ]);

  if (response.length) {
    let amount = [1000, 500, 250]
    let i = 0;
    for (i = 0; i < response.length; i++) {

      // for (const responseData of response) {
      let user = response[i].userId
      let point = response[i].totalPoints

      const userData = await User.findById(user)


      if (point >= 1000) {


        // Get current rubidya market place
        const value = await axios.get(
          "https://pwyfklahtrh.rubideum.net/api/endPoint1/RBD_INR"
        );

        let currentValue = value.data.data.last_price;
        if (currentValue) {
          let convertedAmount = amount[i] / currentValue;

          let position;
          if (i + 1 == 1) {
            position = 'st'
          } else if (i + 1 == 2) {
            position = 'nd'
          } else {
            position = 'rd'
          }

          const updatedUser = await User.findByIdAndUpdate(
            user,
            {
              $inc: { walletAmount: convertedAmount.toFixed(4) },

              $push: {
                transactions: {
                  amount: convertedAmount.toFixed(4),
                  fromWhom: 'Rubideum',
                  typeofTransaction: 'credit',
                  date: Date.now(),
                  kind: `By getting ${i + 1} ${position}  prize`

                }
              }
            },
            { new: true }
          );



        } else {
          // res.status(404).json({ sts: "00", msg: "calculation failed" });
          // return { msg: "calculation failed" }
        }
      }
      // i++
    }
  }
  // return res.json({
  // response
  // });
  // return response
});


//To get top 6 of day weekly monthly and all time
export const topSixPointHolders = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDayUtc = moment().startOf('day').toDate();
  const endOfDayUtc = moment().endOf('day').toDate();
  const startOfDayIst = moment(startOfDayUtc).utcOffset(330).toDate();
  const endOfDayIst = moment(endOfDayUtc).utcOffset(330).toDate();
  // Find the first day of the week (Sunday)
  const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  firstDayOfWeek.setHours(0, 0, 0, 0);
  // Find the last day of the week (Saturday)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);
  // Get the current date
  // Find the first day of the current month
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  // Find the first day of the next month
  const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  firstDayOfNextMonth.setHours(0, 0, 0, 0);
  // Get page and limit from query parameters, set defaults if not provided
  // const type = req.query.type || "day";
  const type = req.body.type;
  console.log(type);
  let response;
  let updatedResponse = []
  if (type === "day") {
    response = await Point.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDayIst,
            $lt: endOfDayIst
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$point' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'profilepics',
          localField: 'user._id',
          foreignField: 'userId',
          as: 'profilePic'
        }
      },
      {
        $unwind: {
          path: '$profilePic',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          userId: '$_id',
          totalPoints: 1,
          userName: '$user.firstName',
          profilePic: {
            $ifNull: ['$profilePic.filePath', null]
          }
        }
      },
      {
        $sort: {
          totalPoints: -1
        }
      },
      {
        $limit: 6
      }
    ]);
  }
  if (type === "week") {
    response = await Point.aggregate([
      {
        $match: {
          createdAt: {
            $gte: firstDayOfWeek,
            $lt: lastDayOfWeek
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$point' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'profilepics',
          localField: 'user._id',
          foreignField: 'userId',
          as: 'profilePic'
        }
      },
      {
        $unwind: {
          path: '$profilePic',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          userId: '$_id',
          totalPoints: 1,
          userName: '$user.firstName',
          profilePic: {
            $ifNull: ['$profilePic.filePath', null]
          }
        }
      },
      {
        $sort: {
          totalPoints: -1
        }
      },
      {
        $limit: 6
      }
    ]);
  }
  if (type === "month") {
    response = await Point.aggregate([
      {
        $match: {
          createdAt: {
            $gte: firstDayOfMonth,
            $lt: firstDayOfNextMonth
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$point' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'profilepics',
          localField: 'user._id',
          foreignField: 'userId',
          as: 'profilePic'
        }
      },
      {
        $unwind: {
          path: '$profilePic',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          userId: '$_id',
          totalPoints: 1,
          userName: '$user.firstName',
          profilePic: {
            $ifNull: ['$profilePic.filePath', null]
          }
        }
      },
      {
        $sort: {
          totalPoints: -1
        }
      },
      {
        $limit: 6
      }
    ]);
  }
  if (type === "all") {
    response = await Point.aggregate([
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$point' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'profilepics',
          localField: 'user._id',
          foreignField: 'userId',
          as: 'profilePic'
        }
      },
      {
        $unwind: {
          path: '$profilePic',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          userId: '$_id',
          totalPoints: 1,
          userName: '$user.firstName',
          profilePic: {
            $ifNull: ['$profilePic.filePath', null]
          }
        }
      },
      {
        $sort: {
          totalPoints: -1
        }
      },
      {
        $limit: 6
      }
    ]);
  }
  // Add rank to each user in the response
  const rankedResponse = response.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
  console.log(rankedResponse);
  updatedResponse.push(rankedResponse[1])
  updatedResponse.push(rankedResponse[0])
  updatedResponse.push(rankedResponse[2])
  updatedResponse.push(rankedResponse[3])
  updatedResponse.push(rankedResponse[4])
  updatedResponse.push(rankedResponse[5])
  return res.json({
    response: updatedResponse,
  });
});


//point and profile pic for logined user
export const pointsAndDetailsOfAUserOneDay = asyncHandler(async (req, res) => {
  const userId = req?.user._id;
  const startOfDayIST = moments.tz('Asia/Kolkata').startOf('day');
  const endOfDayIST = moments.tz('Asia/Kolkata').endOf('day');

  // Convert the start and end times to UTC
  const startOfDayUTC = startOfDayIST.clone().tz('UTC').toDate();
  const endOfDayUTC = endOfDayIST.clone().tz('UTC').toDate();

  // Get page and limit from query parameters, set defaults if not provided

  const result = await Point.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startOfDayUTC,
          $lte: endOfDayUTC,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$point" },
      },
    },
  ]);
  const user = await User.findById(userId)
    .populate("profilePic")
    .select("firstName lastName _id profilePic");

  // If the result is empty, it means the user has no points for today
  if (result.length === 0) {
    res.json({
      userId,
      totalPoints: 0,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePic: user.profilePic?.filePath || null,
      startOfDayUTC,
      endOfDayUTC
    });
  } else {
    res.json({
      userId,
      totalPoints: result[0].totalPoints,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePic: user.profilePic?.filePath || null,
      startOfDayUTC,
      endOfDayUTC
    });
  }
});

//POINTS OF A SINGLE USER ONE DAY

export const thisDayPointsOfAUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const startOfDayIST = moments.tz('Asia/Kolkata').startOf('day');
  const endOfDayIST = moments.tz('Asia/Kolkata').endOf('day');

  // Convert the start and end times to UTC
  const startOfDayUTC = startOfDayIST.clone().tz('UTC').toDate();
  const endOfDayUTC = endOfDayIST.clone().tz('UTC').toDate();

  const response = await Point.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startOfDayUTC,
          $lt: endOfDayUTC,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] } // Exclude direct_referal and team_referal
      },
    },
    {
      $project: {
        userId: 1,
        point: 1,
        pointType: {
          $cond: {
            if: {
              $or: [
                { $eq: ["$pointType", "first_post_comment"] },
                { $eq: ["$pointType", "comment"] },
              ],
            },
            then: "comment",
            else: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$pointType", "first_post_like"] },
                    { $eq: ["$pointType", "like"] },
                  ],
                },
                then: "like",
                else: "$pointType",
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          pointType: "$pointType",
          userId: "$userId",
        },
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        pointType: "$_id.pointType",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
  ]);

  const user = await User.findById(userId).populate("profilePic");

  // Initialize the result with all point types and 0 points
  const pointsResult = pointTypes.map((type) => ({
    pointType: type,
    totalPoints: 0,
  }));

  // Update the result with actual data
  response.forEach((res) => {

    const index = pointsResult.findIndex(
      (point) => point.pointType === res.pointType
    );

    if (index > -1) {
      pointsResult[index].totalPoints = res.totalPoints;
    }
  });
  let finalPointresult = [];
  let fullPoint = 0;
  pointsResult.forEach((element) => {
    fullPoint += element.totalPoints;
    finalPointresult.push(element);
  });
  return res.json({
    response: finalPointresult,
    userName: user.firstName,
    fullPoint,
    userProfilePic: user?.profilePic?.filePath || null,
    userId: user._id,
    startOfDayUTC,
    endOfDayUTC
  });
});


//THIS DAY ALL USERS

export const thisDayPointsOfAllUsers = asyncHandler(async (req, res) => {
  // Get the start and end of the day in local time
  const startOfDayIST = moments.tz('Asia/Kolkata').startOf('day');
  const endOfDayIST = moments.tz('Asia/Kolkata').endOf('day');

  // Convert the start and end times to UTC
  const startOfDayUTC = startOfDayIST.clone().tz('UTC').toDate();
  const endOfDayUTC = endOfDayIST.clone().tz('UTC').toDate();
  // Get page and limit from query parameters, set defaults if not provided
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const response = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfDayUTC,
          $lt: endOfDayUTC,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] } // Exclude direct_referal and team_referal
      },
    },
    {
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        userId: "$_id",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);
  const totalRecords = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfDayUTC,
          $lt: endOfDayUTC,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] } // Exclude direct_referal and team_referal
      },
    },
    {
      $group: {
        _id: "$userId",
      },
    },
  ]);
  const totalPages = Math.ceil(totalRecords.length / limit);
  // Add rank to each user in the response
  const rankedResponse = response.map((item, index) => ({
    ...item,
    rank: skip + index + 1,
  }));
  // Rearrange the order for the first page
  return res.json({
    response: rankedResponse,
    page,
    totalPages,
    totalRecords: totalRecords.length,
    startOfDayUTC,
    endOfDayUTC,
  });
});

//THIS WEEK POINTS OF A SINGLE USER

export const thisWeekPointsOfAUser = asyncHandler(async (req, res) => {

  const { userId } = req.params;

  const now = new Date();


  // Find the first day of the week (Sunday)
  const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  firstDayOfWeek.setHours(0, 0, 0, 0);

  // Find the last day of the week (Saturday)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);

  const response = await Point.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: firstDayOfWeek,
          $lt: lastDayOfWeek,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] } // Exclude direct_referal and team_referal
      },
    },
    {
      $project: {
        userId: 1,
        point: 1,
        pointType: {
          $cond: {
            if: {
              $or: [
                { $eq: ["$pointType", "first_post_comment"] },
                { $eq: ["$pointType", "comment"] },
              ],
            },
            then: "comment",
            else: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$pointType", "first_post_like"] },
                    { $eq: ["$pointType", "like"] },
                  ],
                },
                then: "like",
                else: "$pointType",
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          pointType: "$pointType",
          userId: "$userId",
        },
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        pointType: "$_id.pointType",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
  ]);

  const user = await User.findById(userId).populate("profilePic");

  // Initialize the result with all point types and 0 points
  const pointsResult = pointTypes.map((type) => ({
    pointType: type,
    totalPoints: 0,
  }));

  // Update the result with actual data
  response.forEach((res) => {

    const index = pointsResult.findIndex(
      (point) => point.pointType === res.pointType
    );

    if (index > -1) {
      pointsResult[index].totalPoints = res.totalPoints;
    }
  });
  let finalPointresult = [];
  let fullPoint = 0;
  pointsResult.forEach((element) => {
    fullPoint += element.totalPoints;
    finalPointresult.push(element);
  });
  return res.json({
    response: finalPointresult,
    userName: user.firstName,
    fullPoint,
    userProfilePic: user?.profilePic?.filePath || null,
    userId: user._id,
    firstDayOfWeek,
    lastDayOfWeek
  });
});

//THIS WEEK POINTS OF ALL USER

export const thisWeekPointsOfAllUsers = asyncHandler(async (req, res) => {
  const now = new Date();

  // Find the first day of the week (Sunday)
  const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  firstDayOfWeek.setHours(0, 0, 0, 0);

  // Find the last day of the week (Saturday)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);

  // Get page and limit from query parameters, set defaults if not provided
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const response = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: firstDayOfWeek,
          $lt: lastDayOfWeek,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] }
      },
    },
    {
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        userId: "$_id",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const totalRecords = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: firstDayOfWeek,
          $lt: lastDayOfWeek,
        },
      },
    },
    {
      $group: {
        _id: "$userId",
      },
    },
  ]);

  const totalPages = Math.ceil(totalRecords.length / limit);

  // Add rank to each user in the response
  const rankedResponse = response.map((item, index) => ({
    ...item,
    rank: skip + index + 1,
  }));

  return res.json({
    response: rankedResponse,
    page,
    totalPages,
    totalRecords: totalRecords.length,
    firstDayOfWeek,
    lastDayOfWeek,
  });
});

//THIS MONTH POINTS OF A SINGLE USER


export const thisMonthPointsOfAUser = asyncHandler(async (req, res) => {
  const now = new Date();
  const { userId } = req.params;

  // Find the first day of the current month
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  // Find the first day of the next month
  const firstDayOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );
  firstDayOfNextMonth.setHours(0, 0, 0, 0);

  const response = await Point.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: firstDayOfMonth,
          $lt: firstDayOfNextMonth,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] } // Exclude direct_referal and team_referal
      },
    },
    {
      $project: {
        userId: 1,
        point: 1,
        pointType: {
          $cond: {
            if: {
              $or: [
                { $eq: ["$pointType", "first_post_comment"] },
                { $eq: ["$pointType", "comment"] },
              ],
            },
            then: "comment",
            else: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$pointType", "first_post_like"] },
                    { $eq: ["$pointType", "like"] },
                  ],
                },
                then: "like",
                else: "$pointType",
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          pointType: "$pointType",
          userId: "$userId",
        },
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        pointType: "$_id.pointType",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
  ]);

  const user = await User.findById(userId).populate("profilePic");

  // Initialize the result with all point types and 0 points
  const pointsResult = pointTypes.map((type) => ({
    pointType: type,
    totalPoints: 0,
  }));

  // Update the result with actual data
  response.forEach((res) => {

    const index = pointsResult.findIndex(
      (point) => point.pointType === res.pointType
    );

    if (index > -1) {
      pointsResult[index].totalPoints = res.totalPoints;
    }
  });
  let finalPointresult = [];
  let fullPoint = 0;
  pointsResult.forEach((element) => {
    fullPoint += element.totalPoints;
    finalPointresult.push(element);
  });
  return res.json({
    response: finalPointresult,
    userName: user.firstName,
    fullPoint,
    userProfilePic: user?.profilePic?.filePath || null,
    userId: user._id,
    firstDayOfMonth,
    firstDayOfNextMonth
  });
});

//THIS MONTH POINTS OF ALL USER

export const thisMonthPointsOfAllUsers = asyncHandler(async (req, res) => {
  // Get the current date
  const now = new Date();

  // Find the first day of the current month
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  // Find the first day of the next month
  const firstDayOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );
  firstDayOfNextMonth.setHours(0, 0, 0, 0);

  // Get page and limit from query parameters, set defaults if not provided
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const response = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: firstDayOfMonth,
          $lt: firstDayOfNextMonth,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] }
      },
    },
    {
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        userId: "$_id",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const totalRecords = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: firstDayOfMonth,
          $lt: firstDayOfNextMonth,
        },
      },
    },
    {
      $group: {
        _id: "$userId",
      },
    },
  ]);

  const totalPages = Math.ceil(totalRecords.length / limit);

  // Add rank to each user in the response
  const rankedResponse = response.map((item, index) => ({
    ...item,
    rank: skip + index + 1,
  }));

  return res.json({
    response: rankedResponse,
    page,
    totalPages,
    totalRecords: totalRecords.length,
    firstDayOfMonth,
    firstDayOfNextMonth,
  });
});

//ALL TIME POINTS OF A USER

export const allTimePointsOfUser = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed as a URL parameter
  const mergedPointTypes = {
    like: ['first_post_like', 'like'],
    comment: ['comment', 'first_post_comment'],
    follow: ['follow'],
    referal: ['referal'],
    direct_referal: ['direct_referal'],
    team_referal: ['team_referal'],
    first_post: ['first_post'],
  };

  const response = await Point.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: {
          userId: "$userId",
          pointType: "$pointType",
        },
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        userId: "$_id.userId",
        pointType: "$_id.pointType",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
  ]);

  const user = response.length > 0 ? response[0].userName : null;
  const profilePic = response.length > 0 ? response[0].profilePic : null;

  const pointsByCategory = Object.keys(mergedPointTypes).map(category => {
    const totalPoints = mergedPointTypes[category].reduce((acc, type) => {
      const pointCategory = response.find(r => r.pointType === type);
      return acc + (pointCategory ? pointCategory.totalPoints : 0);
    }, 0);
    return {
      pointType: category,
      totalPoints,
    };
  });

  const totalPoints = pointsByCategory.reduce((acc, category) => acc + category.totalPoints, 0);

  return res.json({
    userId,
    userName: user,
    profilePic,
    response: pointsByCategory,
    fullPoint: totalPoints,
  });
});

//ALL TIME POINTS OF ALL USER

export const allTimePointsOfAllUsers = asyncHandler(async (req, res) => {
  // Get page and limit from query parameters, set defaults if not provided
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const response = await Point.aggregate([
    {
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        userId: "$_id",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const totalRecords = await Point.aggregate([
    {
      $group: {
        _id: "$userId",
      },
    },
  ]);
  const rankedResponse = response.map((item, index) => ({
    ...item,
    rank: skip + index + 1,
  }));

  const totalPages = Math.ceil(totalRecords.length / limit);

  return res.json({
    response: rankedResponse,
    page,
    totalPages,
    totalRecords: totalRecords.length,
  });
});


//To calculate points of a perticular day 
export const perticularDayPointHolders = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date query parameter is required" });
  }

  // Calculate start and end of the given day in IST
  const startOfDayIST = moments.tz(date, 'Asia/Kolkata').startOf('day');
  const endOfDayIST = moments.tz(date, 'Asia/Kolkata').endOf('day');

  // Convert the start and end times to UTC
  const startOfDayUTC = startOfDayIST.clone().tz('UTC').toDate();
  const endOfDayUTC = endOfDayIST.clone().tz('UTC').toDate();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const response = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfDayUTC,
          $lt: endOfDayUTC,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] } // Exclude direct_referal and team_referal
      },
    },
    {
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$point" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "profilepics",
        localField: "user._id",
        foreignField: "userId",
        as: "profilePic",
      },
    },
    {
      $unwind: {
        path: "$profilePic",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        userId: "$_id",
        totalPoints: 1,
        userName: "$user.firstName",
        profilePic: {
          $ifNull: ["$profilePic.filePath", null],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);
  const totalRecords = await Point.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfDayUTC,
          $lt: endOfDayUTC,
        },
        pointType: { $nin: ["direct_referal", "team_referal"] } // Exclude direct_referal and team_referal
      },
    },
    {
      $group: {
        _id: "$userId",
      },
    },
  ]);
  const totalPages = Math.ceil(totalRecords.length / limit);
  // Add rank to each user in the response
  const rankedResponse = response.map((item, index) => ({
    ...item,
    rank: skip + index + 1,
  }));
  // Rearrange the order for the first page
  return res.json({
    response: rankedResponse,
    page,
    totalPages,
    totalRecords: totalRecords.length,
    startOfDayUTC,
    endOfDayUTC,
  });
});


// Get the details of post shared by user
export const shareAPost = asyncHandler(async (req, res) => {

  const { userId, postId } = req.query;
  //Fetching users data
  const user = await User.findById(userId).populate({
    path: "profilePic", select: "filePath"
  });

  if (user) {
    //Fetching media data
    const media = await Media.findById(postId).populate({ path: "userId", select: "firstName lastName", populate: { path: "profilePic", select: "filePath" } })
    if (media) {

      let result = {
        sharedUserId: user._id,
        sharedUserName: user.firstName + " " + user.lastName,
        sharedUserprofilePic: user.profilePic ? user.profilePic.filePath : null,
        postId: media._id,
        description: media.description,
        commentCount: media.commentCount,
        likeCount: media.likeCount,
        postOwnerId: media.userId._id,
        postOwnerName: media.userId.firstName + " " + media.userId.lastName,
        postOwnerProfilePic: media.userId.profilePic ? media.userId.profilePic.filePath : null


      }

      res.status(200).json({
        sts: "01", result
      })

    } else {
      res.status(404).json({ sts: "00", msg: "No posts found" });
    }
  }
  else {
    res.status(404).json({ sts: "00", msg: "No user found" });
  }
});
