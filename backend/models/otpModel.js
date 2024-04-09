import mongoose from "mongoose";

const UserOTPVerificationSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  OTP: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
});

const UserOTPVerification = mongoose.model(
  "UserOTPVerification",
  UserOTPVerificationSchema
);

export default UserOTPVerification;
