import express from "express";
import {
  addLevelPercentages,
  editLevelPercentages,
  editProfileByAdmin,
  getAllLevelPercentages,
  getAllusers,
  getRevenueToAdmin,
  getUsersCount,
  handleActivation,
  searchAllusers,
  // shareSplitting,
  splitProfit,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { addPackage, editPackage } from "../controllers/packageController.js";
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

// Share splitting
// router.route("/share-splitting").get(protect, shareSplitting);

export default router;
