import express from "express";
import {
  addFeed,
  addLevelPercentages,
  deleteFeed,
  editFeed,
  editLevelPercentages,
  editProfileByAdmin,
  getAllLevelPercentages,
  getAllusers,
  getFeed,
  getLevelTree,
  getRevenueToAdmin,
  getUsersCount,
  getVerificationsHistory,
  handleActivation,
  searchAllusers,
  searchInVerifications,
  // shareSplitting,
  splitProfit,
  splitProfitFunctionCron,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { addPackage, editPackage, getUsersByPackage } from "../controllers/packageController.js";
import { uploadAndCompress, uploader } from "../utils/uploader.js";
const router = express.Router();

// Get all users to admin
router.route("/get-all-users").get(protect, getAllusers);

// Search in all users
router.route("/search-users").get(protect, searchAllusers);

// Add 10 level percentages
router.route("/add-level-percentages").post(protect, addLevelPercentages);

// Get percentages
router.route("/get-level-percentages").get(protect, getAllLevelPercentages);

// Edit percentage
router.route("/edit-level-percentages").put(protect, editLevelPercentages);

// Get total numbers of users to admin
router.route("/get-users-count").get(protect, getUsersCount);

// Add new package
router.route("/add-package").post(protect, addPackage);

// Edit package
router.route("/edit-package").put(protect, editPackage);

// Split profit
router.route("/split-profit").get(splitProfit);

// Activate/deactivate the user
router.route("/activation-handle").post(protect, handleActivation)

// Edit user profile by admin
router.route("/edit-user").put(protect, editProfileByAdmin)

// Get revenue to admin
router.route("/get-revenue").get(protect, getRevenueToAdmin)

// Get the level tree
router.route("/get-level-tree").get(protect, getLevelTree);

// Get users based on packages
router.route("/get-users-by-package").get(protect, getUsersByPackage);

// Get verification history
router.route("/get-verifications-history").get(protect, getVerificationsHistory);

// Search in verification history
router.route("/search-in-verifications").get(protect, searchInVerifications);

router.route("/add-monthly-amount").post(splitProfitFunctionCron)

// Share splitting
// router.route("/share-splitting").get(protect, shareSplitting);

//api's for adding feed (ads from admin)
router.route("/add-feed").post(protect,uploader.single("media"), uploadAndCompress,addFeed)

//For editing feed added by admin
router.route("/edit-feed/:feedId").post(protect,editFeed)

//For getting feed added by admin
router.route("/get-feed").get(protect,getFeed)

//For deleting feed added by admin
router.route("/delete-feed").post(protect,deleteFeed)


export default router;
