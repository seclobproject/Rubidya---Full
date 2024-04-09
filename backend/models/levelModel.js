import mongoose from "mongoose";

const levelSchema = new mongoose.Schema(
  {
    levelPercentages: [
      {
        level: { type: String, required: true },
        percentage: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Level = mongoose.model("Level", levelSchema);

export default Level;
