import mongoose, { Mongoose } from "mongoose";
const pointSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        point: {
            type: Number,
            default: 0,
        },
        pointType: {
            type: String,
            enum: ['first_post_comment', 'first_post_like', 'comment', 'first_post', 'like','follow', 'referal', 'direct_referal', 'team_referal'],
        },
        mediaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media"
        },
        followingUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);
const Point = mongoose.model("Point", pointSchema);
export default Point;
