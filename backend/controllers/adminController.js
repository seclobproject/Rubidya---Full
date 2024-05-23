import asyncHandler from "../middleware/asyncHandler.js";
import Feed from "../models/feedModel.js";
import Income from "../models/incomeModel.js";
import Level from "../models/levelModel.js";
import Package from "../models/packageModel.js";
import Revenue from "../models/revenueModel.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { deleteFromS3 } from "../utils/uploader.js";

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

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const userCount = await User.countDocuments({});

  const users = await User.find()
    .select(
      "-password -transactions -profilePic -isVerified -isAdmin -totalReferralAmount -totalMemberProfit -overallAmount -likedPosts"
    )
    .skip(startIndex)
    .limit(limit);

  let pagination = {};
  if (users.length > 0) {
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
    res.status(404).json({ msg: "No users found" });
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
        msg: "User updated successfully",
      });
    } else {
      res.status(400).json({
        msg: "Error updating user",
      });
    }
  }
});

// Edit profile
export const editProfileByAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, countryCode, password, userId } =
    req.body;

  console.log(firstName, lastName, email, phone, countryCode, password, userId);

  if (userId) {
    const user = await User.findById(userId);

    if (user) {
      // Update user details
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.countryCode = countryCode || user.countryCode;

      if (password.length > 0) {
        user.password = password || user.password;
      }

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

// Get the level tree
export const getLevelTree = asyncHandler(async (req, res) => {
  // Get user
  const { userId } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const userCount = await User.countDocuments({});

  // Get the referred users
  const users = await User.findById(userId)
    .populate(
      "referrals",
      "createdAt firstName lastName email phone isAccountVerified payId countryCode acStatus uniqueId"
    )
    .select("referrals")
    .skip(startIndex)
    .limit(limit);

  if (users) {
    res.status(200).json({
      msg: "Level tree fetched successfully",
      users,
    });
  } else {
    res.status(400).json({
      msg: "Error fetching level tree",
    });
  }
});

// Get the verifications history
export const getVerificationsHistory = asyncHandler(async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Get the verifications history from income
  const datas = await Income.find({})
    .populate({
      path: "userId",
      select:
        "firstName lastName email phone payId countryCode sponsor createdAt",
      populate: { path: "sponsor", select: "firstName lastName" },
    })
    .select("userId createdAt adminProfit monthlyDivident levelIncome")
    .populate({ path: "packageSelected", select: "packageName" })
    .skip(startIndex)
    .limit(limit);

  if (datas.length > 0) {
    res.status(200).json({
      msg: "Verifications history fetched successfully",
      datas,
    });
  } else {
    res.status(400).json({
      msg: "Error fetching verifications history",
    });
  }
});

// Search in verifications history
export const searchInVerifications = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = {
    $or: [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { payId: { $regex: search, $options: "i" } },
    ],
  };

  // Handle phone number search separately if it's provided and valid
  if (!isNaN(search)) {
    query.$or.push({ phone: search });
  }

  // Define the query for the Income collection
  const incomeQuery = { $or: [{ userId: { $in: [] } }] }; // Define the query object for Income collection, empty $in array will be populated later

  // Find users matching the search criteria
  const users = await User.find(query);

  // Extract userIds from found users
  const userIds = users.map((user) => user._id);

  // Populate incomeQuery with userIds
  incomeQuery.$or[0].userId.$in = userIds;

  // Find income data based on the populated userIds
  const datas = await Income.find(incomeQuery)
    .populate({
      path: "userId",
      select:
        "firstName lastName email phone payId countryCode sponsor createdAt",
      populate: { path: "sponsor", select: "firstName lastName" },
    })
    .populate({ path: "packageSelected", select: "packageName" });

  if (datas) {
    res.status(200).json({ sts: "01", msg: "Fetched successfully", datas });
  } else {
    res.status(404).json({ message: "No users found" });
  }
});


// Split profit to users in prime and gold membership
export const splitProfitFunctionCron = asyncHandler(async (req, res) => {


  //Fetching package details
  const packages = await Package.find().populate({
    path: "users",
    select: "walletAmount firstName transactions"
  }).select("packageName monthlyDivident");

  for (let eachPackage of packages) {
    let monthlyDivident = eachPackage.monthlyDivident ? eachPackage.monthlyDivident : 0;

    let usersCount = eachPackage.users && eachPackage.users.length ? eachPackage.users.length : 0

    if (monthlyDivident > 0 && usersCount > 0) {

      //Calculating amount to be credited
      let amountToBeCredited = monthlyDivident / usersCount


      for (const user of eachPackage.users) {

        //Updating user and package details

        user.walletAmount = user.walletAmount + amountToBeCredited

        user.transactions.push({
          amount: amountToBeCredited,
          fromWhom: "monthly_divident",
          typeofTransaction: 'credit',
          date: Date.now()
        });

        const updatedUser = await user.save();

        eachPackage.monthlyDivident = 0

        const updatedPackage = await eachPackage.save();
      }

    }

  }
  // res.status(200).json({ sts: "01", msg: "Packages fetched successfully", packages });
});


//Function for adding feeds by admin
export const addFeed = asyncHandler(async (req, res) => {

  if (!req.file) {
    res.status(400).json({ sts: "00", msg: "No file uploaded" });
  }
  const { description } = req?.body

  const { path: filePath, mimetype: fileType, filename: fileName, key: Key } = req.file;

  const feed = await Feed.create({
    fileType,
    fileName,
    description,
    filePath,
    key: Key
  });
  if (feed) {
    res.status(201).json({ sts: "01", msg: "Image uploaded successfully" });
  } else {
    res.status(400).json({ sts: "00", msg: "Error in uploading image" });
  }
})


//Getting feeds added by admin
export const getFeed = asyncHandler(async (req, res) => {

  //Fetching data
  const feedData = await Feed.find({})

  if (feedData) {

    res.status(200).json({
      sts: "01",
      msg: "feed fetched successfully",
      feeds: feedData
    });

  } else {
    res.status(400).json({ sts: "00", msg: "No feeds found" });
  }
})


//Updating feed added
export const editFeed = asyncHandler(async (req, res) => {

  const { description } = req?.body

  const { feedId } = req?.params

  if (!feedId) {
    res.json({
      msg: "please provide feedId",
      sts: "00"
    });
    throw new Error("Please provide feedId");
  }

  if (!description) {
    res.json({
      msg: "please provide description",
      sts: "00"
    });
    throw new Error("Please provide feedId");
  }

  //Fetching feed data
  const feed = await Feed.findById(feedId);
  if (feed) {

    const updateFeed = await Feed.findByIdAndUpdate(feedId, {
      description: description,
    });

    if (updateFeed) {

      res.status(200).json({ sts: "01", msg: "Feed updated successfully" });

    } else {
      res.status(400).json({ sts: "00", msg: "Feed not updated" });
    }
  } else {
    res.status(400).json({ sts: "00", msg: "Feed not found" });
  }
})

//Function to delete feed
export const deleteFeed = asyncHandler(async (req, res) => {

  const { feedId } = req?.body;

  if (!feedId) {

    throw new Error("no feed i found")
  }

  //Fetching data from feed
  const singleFeedData = await Feed.findById(feedId)

  if (!singleFeedData) {

    return res.json({
      msg: `no data found with this id: ${feedId}`
    })
  }

  //deleting uploaded image from s3 bucket
  const deleteMediaFromS3 = await deleteFromS3(singleFeedData.key)

  if (deleteMediaFromS3) {

    await Feed.findByIdAndDelete(singleFeedData._id).then(() => {
      res.json({
        sts: "01",
        msg: "deleted successfully"
      })
    })
  } else {
    res.json({
      sts: "00",
      msg: "deletion failed"
    })
  }
})