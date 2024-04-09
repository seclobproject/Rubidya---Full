import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    nodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    countryCode: {
      type: Number,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    ownSponsorId: {
      type: String,
      required: true,
    },
    isOTPVerified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      // Verified if the user exist in rubideum wallet
      type: Boolean,
      default: false,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    walletAmount: {
      type: Number,
      double: true,
      default: 0,
    },
    totalReferralAmount: {
      type: Number,
      double: true,
      default: 0,
    },
    totalMemberProfit: {
      type: Number,
      double: true,
      default: 0,
    },
    overallAmount: {
      type: Number,
      double: true,
      default: 0,
    },
    transactions: [
      {
        amount: Number,
        kind: String,
        fromWhom: String,
        level: String,
        percentage: Number,
        status: String,
        typeofTransaction: String,
      },
    ],
    payId: {
      type: String,
    },
    uniqueId: {
      type: String,
    },
    profilePic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProfilePic",
    },
    referrals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    packageSelected: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    profitSplitting: {
      type: Boolean,
      default: false,
    },
    packageName: [
      {
        type: String,
      },
    ],
    acStatus: {
      type: Boolean,
      default: true,
    },
    likedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    bio: {
      type: String,
    },
    profession: {
      type: String,
    },
    gender: {
      type: String,
      // enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    dateOfBirth: {
      type: Date,
    },
    location: {
      type: String,
    },
    district: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Doing encryption before saving to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);
export default User;
