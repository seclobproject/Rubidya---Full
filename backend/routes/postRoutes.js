import express from "express";
const router = express.Router();

import { protect } from "../middleware/authMiddleware.js";
import {
  deleteAComment,
  deleteACommentToMyPost,
  getLatestPosts,
  likeAPost,
  postAComment,
  getCommentsOfAPost,
  replyAComment,
  likeAComment,
  getReplyOfAComment,
  getMostLovedPosts,
  thisDayPointsOfAllUsers,
  thisWeekPointsOfAllUsers,
  thisMonthPointsOfAllUsers,
  allTimePointsOfAllUsers,
  thisDayPointsOfAUser,
  thisWeekPointsOfAUser,
  thisMonthPointsOfAUser,
  allTimePointsOfUser,
  topSixPointHolders,
  perticularDayPointHolders,
  pointsAndDetailsOfAUserOneDay,
  shareAPost


} from "../controllers/postsController.js";

// Like/Dislike a post
router.route("/like").post(protect, likeAPost);

// Get latest posts in the feed
router.route("/get-latest-posts").get(protect, getLatestPosts);

// Add a comment
router.route("/post-comment").post(protect, postAComment);

//Delete a comment added by user
router.route("/delete-comment/:id").delete(protect, deleteAComment);

//Get details of commented users of a post
router.route("/get-comment-details/:postId").get(protect, getCommentsOfAPost)

//Delete a comment posted by other user to their post
router
  .route("/delete-comment-to-my-post")
  .delete(protect, deleteACommentToMyPost);


//Reply a comment
router.route("/reply-comment").post(protect, replyAComment)


// Like/Dislike a comment
router.route("/like-comment").post(protect, likeAComment);


//Get details of replies of a comment
router.route("/get-reply-of-comment/:commentId").get(protect, getReplyOfAComment)

//most loved posts
router.route("/get-most-loved-posts").get(protect, getMostLovedPosts)

router.route("/this-day-all-users").get(thisDayPointsOfAllUsers)

//toppers of this week
router.route("/this-week-all-users").get(thisWeekPointsOfAllUsers)


//Toppers of this month
router.route("/this-month-all-users").get(thisMonthPointsOfAllUsers)

//Toppers for all time
router.route("/all-time-all-users").get(allTimePointsOfAllUsers)

//To get todays point of a user
router.route("/this-day/:userId").get(thisDayPointsOfAUser)

//To get this week points of a user
router.route("/this-week/:userId").get(thisWeekPointsOfAUser)

//To get this month points of a user
router.route("/this-month/:userId").get(thisMonthPointsOfAUser)

//All time points of a user
router.route("/all-time/:userId").get(allTimePointsOfUser)

//To get top 6 users of daily weekly monthly and all time  
router.route("/top-six").get(topSixPointHolders)

//to get profile and points of a specif user
router.route("/points-and-details").get(protect, pointsAndDetailsOfAUserOneDay)

//to get point details of a perticular day
router.route("/perticular-day-all-users").get(perticularDayPointHolders)

//Share a post
router.route("/share-post").post(protect, shareAPost)

export default router;

