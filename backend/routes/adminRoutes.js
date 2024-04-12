import express from "express";
import {
  addLevelPercentages,
  editLevelPercentages,
  editProfileByAdmin,
  getAllLevelPercentages,
  getAllusers,
  getLevelTree,
  getRevenueToAdmin,
  getUsersCount,
  getVerificationsHistory,
  handleActivation,
  searchAllusers,
  searchInVerifications,
  // shareSplitting,
  splitProfit,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { addPackage, editPackage, getUsersByPackage } from "../controllers/packageController.js";
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

// Share splitting
// router.route("/share-splitting").get(protect, shareSplitting);

export default router;
