import mongoose from "mongoose";
const feedSchema = new mongoose.Schema(
  {
  
    fileType: {
      type: String,
    },
    fileName: {
      type: String,
    },
    filePath: {
      type: String,
    },
    description: {
      type: String,
    },
    key:{
      type:String,
      required:true,
    }
  },
  {
    timestamps: true,
  }
);
const Feed = mongoose.model("Feed", feedSchema);
export default Feed;