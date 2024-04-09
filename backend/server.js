import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// import cron from "node-cron";

import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import postRoutes from "./routes/postRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
connectDB();
// Database connection

// Uploads directory
app.use("/uploads", express.static("/var/www/seclob/rubidya/uploads"));
// app.use("/uploads", express.static("/uploads"));
app.use("/uploads/profilePic", express.static("/var/www/seclob/rubidya/uploads/profilePic"));
// app.use("/uploads/profilePic", express.static("/uploads/profilePic"));
// Uploads directory

// Setup cron job
// cron.schedule(" * * * * *", () => {
  
// });
// Setup cron job

// API routes
app.get("/", (req, res) => {
  res.status(201).json("Running");
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/posts", postRoutes);
// API routes

app.use(errorHandler);
app.use(notFound);

const port = process.env.PORT || 6004;
app.listen(port, () => console.log(`Server running in ${port}`));
