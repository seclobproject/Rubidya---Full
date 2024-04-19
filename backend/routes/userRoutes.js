import express from "express";
const router = express.Router();

import { protect } from "../middleware/authMiddleware.js";
import {
  addPayId,
  blockAUser,
  changePassword,
  convertINR,
  deductRubideum,
  editUserProfile,
  findAllUser,
  findOnesDetail,
  follow,
  getDirectReferredUsers,
  getFollowers,
  getFollowing,
  getMedia,
  getProfilePicture,
  getStats,
  getSuggestions,
  getUserProfile,
  loginUser,
  refferalTreeCount,
  registerUser,
  registerUserByReferral,
  reportAccount,
  resendOTP,
  searchAllFollowers,
  searchAllFollowing,
  // sendOTPTest,
  sendOTPforForget,
  syncWallet,
  unfollow,
  // updateNewPackage,
  uploadImage,
  uploadProfilePicture,
  verifyOTP,
  verifyOTPForForget,
  verifyUser,
  videoUpload,
} from "../controllers/userController.js";

import {
  resizeAndCompressImage,
  resizeAndCompressImageForProfilePic,
  upload,
} from "../middleware/uploadMiddleware.js";

import {
  getAllPackages,
  getPackageById,
  selectPackage,
} from "../controllers/packageController.js";
import { setDP } from "../utils/uploader.js";

router.route("/").post(protect, registerUser);
router.route("/add-user-by-refferal").post(registerUserByReferral);

// OTP Verification
router.route("/verify-otp").post(verifyOTP);

// Send forget OTP
router.route("/send-forget-otp").post(sendOTPforForget);

// Verify OTP for forget password
router.route("/forget-password-otp").post(verifyOTPForForget);

// Change password
router.route("/change-password").put(changePassword);

// Resend OTP
router.route("/resend-otp").post(resendOTP);

// Get user profile
router.route("/profile").get(protect, getUserProfile);

router.route("/login").post(loginUser);

router.route("/verify-user").post(protect, verifyUser);

// Upload image
router
  .route("/upload-image")
  .post(protect, upload.single("media"), resizeAndCompressImage, uploadImage);

// Get uploaded image
router.route("/get-media").get(protect, getMedia);

// Add PayId
router.route("/add-pay-id").post(protect, addPayId);

// Get direct reffered users
router.route("/get-direct-refferals").get(protect, getDirectReferredUsers);

// Get refferal tree count
router.route("/get-refferal-tree-count").get(protect, refferalTreeCount);

// Calculate Rubideum
router.route("/deduct-rubideum").post(protect, deductRubideum);

// Sync unrealised to rubideum wallet
router.route("/sync-wallet").get(protect, syncWallet);

// Get all packages
router.route("/get-packages").get(protect, getAllPackages);

// Get package by ID
router.route("/get-package-by-id").post(protect, getPackageById);

// Select the package
router.route("/select-package").post(protect, selectPackage);

// Get all status
router.route("/get-stats").get(protect, getStats);

// Convert INR - RBD
router.route("/convert-inr").post(protect, convertINR);

// Edit user profile
router.route("/edit-profile").put(protect, editUserProfile);

// Add profile picture
router
  .route("/add-profile-pic")
  .post(
    protect,
    upload.single("media"),
    resizeAndCompressImageForProfilePic,
    uploadProfilePicture
  );

// Get profile picture
router.route("/get-profile-pic").get(protect, getProfilePicture);

// Follow a person
router.route("/follow").post(protect, follow);

// Unfollow a person
router.route("/unfollow").post(protect, unfollow);

// Get suggestions
router.route("/get-suggestions").get(protect, getSuggestions);

// Get following
router.route("/get-following").get(protect, getFollowing);

// Get followers
router.route("/get-followers").get(protect, getFollowers);

//Get Search in all users
router.route("/all-users").get(protect, findAllUser);

//Get details of a user
router.route("/get-user/:id").get(protect, findOnesDetail);

// Upload profile picture new
router.route("/upload-dp").post(protect, setDP);

//Video uploading
router.route("/upload-videos").post(protect,videoUpload)

//Block a user
router.route("/block-user").put(protect,blockAUser)

//Report a user
router.route("/report-user").post(protect,reportAccount)

//Searching users from following list
router.route("/search-following").get(protect,searchAllFollowing)

//Searching users from followers list
router.route("/search-followers").get(protect,searchAllFollowers)


// Remove repeating values
// router.route("/update-package").get(updateNewPackage);

export default router;
