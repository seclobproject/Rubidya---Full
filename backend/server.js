import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

import cron from "node-cron";

import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import walletRoutes from "./routes/walletRoutes.js"
import { splitProfitFunctionCron } from "./controllers/adminController.js";
import { thisDayPointsOfTopThreeUsers } from "./controllers/postsController.js";
import { testCron } from "./controllers/userController.js";

const NODE_ENV = "production";

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

// Setup cron job to be triggerd on start of every month
cron.schedule(" 0 0 1 * *", () => {
  splitProfitFunctionCron()
});


// Setup cron job to split prize money to top three users
cron.schedule("29 18 * * *", () => {
  thisDayPointsOfTopThreeUsers()
});

cron.schedule("08 09 * * *", () => {
  testCron()
});




// Setup cron job

// API ro
//app.get("/", (req, res) => {
//  res.status(201).json("Running");
//});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/wallet", walletRoutes);
// API routes

if (NODE_ENV === "production") {
  // Serve frontend files
  app.use(
    express.static("/var/www/seclob/rubidya/frontend/dist")
  );
  // Handle React routing, return all requests to React app
  app.get("*", (req, res) => {
    res.sendFile(
      "/var/www/seclob/rubidya/frontend/dist/index.html"
    );
  });
}

app.use(errorHandler);
app.use(notFound);




const port = process.env.PORT || 6004;
app.listen(port, () => console.log(`Server running in ${port}`));

