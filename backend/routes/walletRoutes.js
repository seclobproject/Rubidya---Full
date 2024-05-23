import express from "express";
const router = express.Router();

import { protect } from "../middleware/authMiddleware.js";

import { creditWallet, editPayId, payToRubideum, subscription, withdraw } from "../controllers/walletController.js";
 "../controllers/postsController.js";

//Credit wallet amount of a user
router.route("/credit-wallet").post(protect, creditWallet);


//Edit payId of auser
router.route("/edit-payid").put(protect,editPayId)

// //Subscription api
router.route("/add-subscription").post(protect,subscription)

// //Withdraw api
router.route("/withdraw").post(protect,withdraw)

// //Pay to rubideum exchange
router.route("/pay-to-rubideum").post(protect,payToRubideum)




export default router;
