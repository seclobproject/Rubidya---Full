import asyncHandler from "../middleware/asyncHandler.js";
import Level from "../models/levelModel.js";
import Package from "../models/packageModel.js";
import Revenue from "../models/revenueModel.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

// Search in all users
export const searchAllusers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let query = {
    $or: [
      {
        firstName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
      {
        payId: {
          $regex: search,
          $options: "i",
        },
      },
    ],
  };

  // Handle phone number search separately if it's provided and valid
  if (!isNaN(search)) {
    query.$or.push({
      phone: search,
    });
  }

  const users = await User.find(query);

  if (users) {
    res.status(200).json({ sts: "01", msg: "Fetched successfully", users });
  } else {
    res.status(404).json({ message: "No users found" });
  }
});

// With pagination
export const getAllusers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  console.log(page, limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const userCount = await User.countDocuments({});

  const users = await User.find()
    .select(
      "-password -transactions -profilePic -isVerified -isAdmin -totalReferralAmount -totalMemberProfit -overallAmount -likedPosts"
    )
    .skip(startIndex)
    .limit(limit);

  if (users.length > 0) {

    const pagination = {};

    if (endIndex < userCount) {
      pagination.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit: limit,
      };
    }


    res
      .status(200)
      .json({ users, pagination, sts: "01", msg: "Fetched successfully" });

  } else {
    res.status(404).json({ message: "No users found" });
  }
});

// Add 10 level percentages
export const addLevelPercentages = asyncHandler(async (req, res) => {
  const { levelPercentages } = req.body;

  let level = await Level.findOne();

  if (!level) {
    level = new Level({ levelPercentages });
  } else {
    level.levelPercentages = levelPercentages;
  }

  const updateLevel = await level.save();

  if (updateLevel) {
    res.status(201).json({
      message: "Level percentages added successfully",
    });
  } else {
    res.status(400).json({
      message: "Level percentages not added",
    });
  }
});

// Get all level percentages
export const getAllLevelPercentages = asyncHandler(async (req, res) => {
  const level = await Level.findOne();
  if (level) {
    res.status(200).json(level.levelPercentages);
  } else {
    res.status(404).json({ message: "No level percentages found" });
  }
});

// Edit the percentage of each level
export const editLevelPercentages = asyncHandler(async (req, res) => {
  const { level, percentage } = req.body;

  const updatedLevel = await Level.findOneAndUpdate(
    { "levelPercentages.level": level },
    { $set: { "levelPercentages.$.percentage": percentage } },
    { new: true }
  );

  if (updatedLevel) {
    res.status(201).json({
      message: "Level percentages updated successfully",
    });
  } else {
    res.status(400).json({
      message: "Level percentages not updated",
    });
  }
});

// Get total numbers of users to admin
export const getUsersCount = asyncHandler(async (req, res) => {
  // const usersCount = await User.countDocuments({});
  const usersCount = await User.aggregate([
    {
      $group: {
        _id: "$isVerified",
        count: { $sum: 1 },
      },
    },
  ]);

  if (usersCount) {
    let isVerifiedCount = 0;
    let notVerifiedCount = 0;
    let totalCount = 0;

    usersCount.forEach((item) => {
      if (item._id == true) {
        isVerifiedCount = item.count;
      } else {
        notVerifiedCount = item.count;
      }
    });
    totalCount = isVerifiedCount + notVerifiedCount;
    res.status(200).json({ isVerifiedCount, notVerifiedCount, totalCount });
  } else {
    res.status(404).json({ sts: "00", msg: "No users found" });
  }
});

// Get revenue
export const getRevenueToAdmin = asyncHandler(async (req, res) => {
  // Get revenue from revenue
  const revenue = await Revenue.findOne({});

  if (revenue) {
    const data = {
      monthlyRevenue: parseFloat(revenue.monthlyRevenue).toFixed(2),
      totalRevenue: parseFloat(revenue.totalRevenue).toFixed(2),
    };
    res.status(200).json(data);
  } else {
    res.status(404).json({ sts: "00", msg: "No revenue found" });
  }
});

// Split profit to users in prime and gold membership
export const splitProfit = asyncHandler(async (req, res) => {
  // Get the total amount reached to company
  const revenue = await Revenue.findOne({}).select("monthlyRevenue");

  const monthlyRevenue = revenue.monthlyRevenue;

  if (monthlyRevenue > 0) {
    const packages = await Package.find().populate("users");

    if (packages) {
      // Fetch each package, calculate the profit percentage and split profit to users
      for (let eachPackage of packages) {
        const { memberProfit } = eachPackage;

        console.log(`packageName: ${eachPackage.packageName}`);

        // Calculate profit percentage of each package
        const profitPercentageAmount = (memberProfit / 100) * monthlyRevenue;

        // Calcutate the profit per person
        const usersLength = eachPackage.users.length;

        console.log(`usersLength: ${usersLength}`);

        if (usersLength > 0 && profitPercentageAmount > 0) {
          const profitPerPerson = profitPercentageAmount / usersLength;
          // Get all the users who have this package
          const users = eachPackage.users;

          // Split profit to users
          for (let eachUser of users) {
            eachUser.unrealisedMonthlyProfit =
              eachUser.unrealisedMonthlyProfit + profitPerPerson;

            // Save to the user's database
            const updatedUser = await eachUser.save();
            if (!updatedUser) {
              console.log(`User ${eachUser.firstName} not updated`);
            } else {
              console.log("User updated successfully");
            }
          }
        } else {
          console.log(`No users found in ${eachPackage.packageName}`);
        }
      }

      // Clear the monthly revenue
      revenue.monthlyRevenue = 0;
      const updatedRevenue = await revenue.save();

      if (updatedRevenue) {
        res.status(201).json({
          message: "Profit splitted and monthly revenue cleared successfully",
        });
      } else {
        res.status(400).json({
          message: "Monthly revenue not updated",
        });
      }
    } else {
      res.status(400).json({ sts: "00", msg: "No packages found" });
    }
  } else {
    res.status(400).json({ sts: "00", msg: "Monthly revenue is zero" });
  }
});

export const handleActivation = asyncHandler(async (req, res) => {
  // Get user ID and status
  const { userId, status } = req.body;

  if (!userId || status == undefined) {
    res.status(400).json({
      message: "Please provide all the required fields",
    });
  } else {
    // Update user with new status
    const updatedUser = await User.findByIdAndUpdate(userId, {
      acStatus: status,
    });

    if (updatedUser) {
      res.status(201).json({
        message: "User updated successfully",
      });
    } else {
      res.status(400).json({
        message: "Error updating user",
      });
    }
  }
});

// Edit profile
export const editProfileByAdmin = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    countryCode,
    isVerified,
    password,
    userId,
  } = req.body;

  if (userId) {
    const user = await User.findById(userId);

    if (user) {
      // Update user details
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.countryCode = countryCode || user.countryCode;

      if (user.isAccountVerified !== isVerified) {
        user.isAccountVerified = isVerified;
      }

      user.password = password || user.password;

      const updateUser = await user.save();

      if (updateUser) {
        res
          .status(201)
          .json({ sts: "01", msg: "Profile updated successfully" });
      } else {
        res.status(400).json({ sts: "00", msg: "Error in updating profile" });
      }
    } else {
      res.status(400).json({ sts: "00", msg: "User not found" });
    }
  } else {
    res.status(400);
    throw new Error("Please pass the userId");
  }
});

// Share splitting (A percentage of profit will be given to users who brings 100 people of similar package and 1000 people in total under his 10 level tree)

// export const shareSplitting = asyncHandler(async (req, res) => {

//   const user = await User.findById(req.user._id);

//   if (user) {
//     // Get the count of referred users
//     const referredUsersCount = user.referrals.length;

//     if (referredUsersCount >= 2) {
//       // Check the package of each user and increment each package count
//       const referredUsers = user.referrals;

//       let packageCounts = {};

//       for (let i = 0; i < referredUsers.length; i++) {
//         const referredUser = await User.findOne({
//           _id: referredUsers[i],
//         });

//         // console.log(`This is referred user: ${referredUser}`);

//         if (referredUser) {
//           const referredUserPackage = await Package.findOne({
//             _id: referredUser.packageSelected,
//           });

//           if (referredUserPackage) {
//             if (packageCounts[referredUserPackage.packageSlug]) {
//               packageCounts[referredUserPackage.packageSlug] += 1;
//             } else {
//               packageCounts[referredUserPackage.packageSlug] = 1;
//             }
//           } else {
//             continue;
//           }
//         } else {
//           continue;
//         }
//       }

//       console.log(packageCounts);

//       res.status(201).json({
//         message: "Profit splitted successfully",
//       });
//     }
//   }
// });
