import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema(
  {
    totalRevenue: { type: Number, double: true },
    monthlyRevenue: { type: Number, double: true },
  },
  {
    timestamps: true,
  }
);

const Revenue = mongoose.model("Revenue", revenueSchema);

export default Revenue;
