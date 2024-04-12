import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    packageSelected: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    levelIncome: {
      type: Number,
      double: true,
      default: 0,
    },
    monthlyDivident: {
      type: Number,
      double: true,
      default: 0,
    },
    adminProfit: {
      type: Number,
      double: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Income = mongoose.model("Income", incomeSchema);

export default Income;
