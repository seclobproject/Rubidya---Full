import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    memberProfit: {
      type: Number,
      default: 0,
    },
    benefits: [
      {
        type: String,
      },
    ],
    packageSlug: {
      type: String,
      required: true,
    },
    monthlyDivident: {
      type: Number,
      double: true,
      default: 0,
    },
    usersCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Package = mongoose.model("Package", packageSchema);
export default Package;
