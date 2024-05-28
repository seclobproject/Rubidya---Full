import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";

import Level from "../models/levelModel.js";
import Media from "../models/mediaModel.js";

import { transporter } from "../config/nodeMailer.js";
import UserOTPVerification from "../models/otpModel.js";

import axios from "axios";
import Package from "../models/packageModel.js";
import Revenue from "../models/revenueModel.js";
import ProfilePic from "../models/profilePicModel.js";
import mongoose from "mongoose";
import Income from "../models/incomeModel.js";
import Feed from "../models/feedModel.js";

const generateRandomString = () => {
  const baseString = "RBD";
  const randomDigits = Math.floor(Math.random() * 999999);
  return baseString + randomDigits.toString();
};

function generateOTP() {
  // Generate a random number between 10000 and 99999 (inclusive)
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  return randomNumber;
}

// Send OTP verification email
const sendOTP = async ({ _id, email, countryCode, phone }, res) => {
  console.log(countryCode, phone);
  try {
    const OTP = generateOTP();

    const mailOptions = {
      from: '"Rubidya" <info@rubidya.com>',
      to: email,
      subject: "Verify Your Rubidya Account",
      html: `<p>Enter the OTP <b>${OTP}</b> in the app to verify your email</p>`,
    };

    // Hash the OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(OTP.toString(), salt); // Convert OTP to string before hashing
    const newOTPVerification = new UserOTPVerification({
      userId: _id,
      OTP: hashedOTP,
      email: email ? email : "",
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    // Save OTP record
    const newOTP = await newOTPVerification.save();

    if (newOTP) {
      if (countryCode == 91) {
        // await transporter.sendMail(mailOptions);

        console.log("Sending OTP via SMS");

        const response = await axios.get(
          `https://otp2.aclgateway.com/OTP_ACL_Web/OtpRequestListener?enterpriseid=stplotp&subEnterpriseid=stplotp&pusheid=stplotp&pushepwd=stpl_01&msisdn=${phone}&sender=HYBERE&msgtext=Welcome%20to%20Rubidya!%20Your%20OTP%20for%20registration%20is%20%20${OTP}.%20Please%20enter%20this%20code%20to%20complete%20your%20registration&dpi=1101544370000033504&dtm=1107170911722074274`
        );
      } else {
        await transporter.sendMail(mailOptions);
      }

      // Check if 'res' is defined before calling 'json'
      if (res && typeof res.json === "function") {
        res.status(200).json({
          status: "PENDING",
          message: "Verification OTP email sent",
          userId: _id,
          email,
        });
      } else {
        console.error("Response object is not properly defined.");
      }
    } else {
      res.status(400);
      throw new Error("Error saving OTP record");
    }
  } catch (error) {
    console.log(error);
  }
};

// Send OTP for forget password
const sendOTPForget = async ({ email, countryCode, phone }, res) => {
  try {
    const OTP = generateOTP();

    const mailOptions = {
      from: '"Rubidya" <info@rubidya.com>',
      to: email,
      subject: "Reset Rubidya Account",
      html: `<p>Enter the OTP <b>${OTP}</b> for verify/reset account</p>`,
    };

    // Hash the OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(OTP.toString(), salt); // Convert OTP to string before hashing

    const newOTPVerification = new UserOTPVerification({
      OTP: hashedOTP,
      email: email ? email : "",
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    // Save OTP record
    const newOTP = await newOTPVerification.save();

    if (newOTP) {
      if (countryCode == 91) {
        // await transporter.sendMail(mailOptions);

        const response = await axios.get(
          `https://otp2.aclgateway.com/OTP_ACL_Web/OtpRequestListener?enterpriseid=stplotp&subEnterpriseid=stplotp&pusheid=stplotp&pushepwd=stpl_01&msisdn=${phone}&sender=HYBERE&msgtext=Hello%20from%20Rubidya.%20Your%20OTP%20for%20password%20reset%20is%20${OTP}.%20Enter%20this%20code%20to%20securely%20reset%20your%20password&dpi=1101544370000033504&dtm=1107170911810846940`
        );
        console.log(`SMS OTP response: ${response.data}`);
      } else {
        await transporter.sendMail(mailOptions);
      }

      // Check if 'res' is defined before calling 'json'
      if (res && typeof res.json === "function") {
        res.json({
          status: "PENDING",
          message: "OTP email sent",
          email,
        });
      } else {
        console.error("Response object is not properly defined.");
      }
    } else {
      res.status(400);
      throw new Error("Error saving OTP record");
    }
  } catch (error) {
    console.log(error);
  }
};

// Register User
export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, countryCode, email, password } = req.body;

  if (!firstName || !phone || !countryCode || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the required fields");
  }

  const user = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (user) {
    res.status(400);
    throw new Error("User already exists");
  } else {
    const ownSponsorId = generateRandomString();

    const createUser = await User.create({
      sponsor: null,
      firstName,
      lastName,
      countryCode,
      phone,
      email,
      password,
      ownSponsorId,
      transactions: [],
      referrals: [],
      payId: "",
      uniqueId: "",
    });

    if (createUser) {
      sendOTP(
        {
          _id: createUser._id,
          email: createUser.email,
          countryCode: createUser.countryCode,
          phone: createUser.phone,
        },
        res
      );
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  }
});

// Verify OTP Email/SMS
export const verifyOTP = asyncHandler(async (req, res) => {
  const { OTP, userId } = req.body;

  if (!userId || !OTP) {
    res.status(400);
    throw new Error("Please enter all the required fields");
  } else {
    const userOTP = await UserOTPVerification.findOne({
      userId,
    });

    if (userOTP.length <= 0) {
      throw new Error("OTP record does not exist!");
    } else {
      // Check if OTP is expired
      const { expiresAt } = userOTP;

      if (expiresAt < Date.now()) {
        await userOTP.deleteMany({ userId });
        throw new Error("OTP has expired!");
      } else {
        const validOTP = await bcrypt.compare(OTP, userOTP.OTP);

        if (!validOTP) {
          throw new Error("Invalid OTP code passed!");
        } else {
          const updatedUser = await User.updateOne(
            { _id: userId },
            { $set: { isOTPVerified: true } }
          );

          if (updatedUser) {
            const deleteOTP = await UserOTPVerification.deleteMany({ userId });

            if (deleteOTP) {
              res.json({
                sts: "01",
                msg: "OTP verified successfully",
              });
            } else {
              res.status(400);
              throw new Error("Error deleting OTP record");
            }
          } else {
            res.status(400);
            throw new Error("Error updating user record");
          }
        }
      }
    }
  }
});

// Resend OTP
export const resendOTP = asyncHandler(async (req, res) => {
  const { email, userId } = req.body;

  const user = await User.findById(userId);

  if (!userId || !email) {
    res.status(400);
    throw new Error("Please enter all the required fields");
  } else {
    const deleteExistingOTP = await UserOTPVerification.deleteMany({ userId });
    if (deleteExistingOTP) {
      sendOTP(
        {
          _id: userId,
          email,
          countryCode: user.countryCode,
          phone: user.phone,
        },
        res
      );
    } else {
      res.status(400);
      throw new Error("Error deleting existing OTP record");
    }
  }
});

// Resend OTP (Send OTP for forget)
export const sendOTPforForget = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existEmail = await User.findOne({ email });

  if (!email) {
    res.status(400);
    throw new Error("Please enter all the required fields");
  } else {
    if (existEmail) {
      const deleteExistingOTP = await UserOTPVerification.deleteMany({ email });
      if (deleteExistingOTP) {
        sendOTPForget(
          {
            email,
            countryCode: existEmail.countryCode,
            phone: existEmail.phone,
          },
          res
        );
      } else {
        res.status(400);
        throw new Error("Error deleting existing OTP record");
      }
    } else {
      res.status(400).json({ sts: "00", msg: "Email does not exist" });
    }
  }
});

// Verify forget password OTP
export const verifyOTPForForget = asyncHandler(async (req, res) => {
  const { OTP, email } = req.body;

  if (!email || !OTP) {
    res.status(400);
    throw new Error("Please enter all the required fields");
  } else {
    const userOTP = await UserOTPVerification.findOne({
      email,
    });

    if (userOTP.length <= 0) {
      throw new Error("OTP record does not exist!");
    } else {
      // Check if OTP is expired
      const { expiresAt } = userOTP;

      if (expiresAt < Date.now()) {
        await userOTP.deleteMany({ email });
        throw new Error("OTP has expired!");
      } else {
        const validOTP = await bcrypt.compare(OTP, userOTP.OTP);

        if (!validOTP) {
          throw new Error("Invalid OTP code passed!");
        } else {
          const deleteOTP = await UserOTPVerification.deleteMany({ email });

          const updateUser = await User.updateOne(
            { email },
            { $set: { isOTPVerified: true } }
          );

          if (deleteOTP && updateUser) {
            res.json({
              sts: "01",
              msg: "OTP verified successfully",
            });
          } else {
            res.status(400);
            throw new Error("Error deleting OTP record");
          }
        }
      }
    }
  }
});

// Register User By Referral or direct registeration
export const registerUserByReferral = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, countryCode, email, password, userId } =
    req.body;

  if (!firstName || !phone || !countryCode || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the required fields");
  }

  const user = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (user) {
    res.status(400).json({ sts: "00", msg: "User already exists" });
  } else {
    const ownSponsorId = generateRandomString();

    const createUser = await User.create({
      sponsor: userId || null,
      firstName,
      lastName,
      countryCode,
      phone,
      email,
      password,
      ownSponsorId,
      transactions: [],
      referrals: [],
      payId: "",
      uniqueId: "",
    });

    if (createUser) {
      // Add the new created user to the referred user's referrals
      if (userId) {
        const referredUser = await User.findOneAndUpdate(
          { _id: userId },
          { $push: { referrals: createUser._id } },
          { new: true }
        );
      }

      sendOTP(
        {
          _id: createUser._id,
          email: createUser.email,
          countryCode: createUser.countryCode,
          phone: createUser.phone,
        },
        res
      );
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  }
});

// Login user
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, adminLogin } = req.body;

  if (!email || !password) {
    res
      .status(400)
      .json({ sts: "00", msg: "Please enter all required fields" });
  }

  let user = await User.findOne({ email });
  if (!user) {
    if (parseInt(email)) {
      user = await User.findOne({ phone: parseInt(email) });
    } else {
      res.status(401).json({ sts: "00", msg: "User does not exist" });
    }
  }

  if (user && (await user.matchPassword(password))) {
    if (adminLogin) {
      if (!user.isAdmin) {
        res.status(401).json({
          sts: "00",
          msg: "You are not authorized to access this page",
        });
      }
    }

    const token = jwt.sign(
      { userId: user._id },
      "secret_of_jwt_for_rubidya_5959",
      {
        expiresIn: "800d",
      }
    );

    res.status(200).json({
      _id: user._id,
      sponsor: user.sponsor,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      acStatus: user.acStatus,
      ownSponsorId: user.ownSponsorId,
      isOTPVerified: user.isOTPVerified,
      totalReferralAmount: user.totalReferralAmount,
      token_type: "Bearer",
      access_token: token,
      sts: "01",
      msg: "Success",
    });
  } else {
    res.status(401).json({ sts: "00", msg: "User does not exist" });
  }
});

// Verify user (Call this after the user successfully did the payment)
// First we will call deduct rubideum API. After that we have to call the verify user API.
// Calculate Rubideum
export const deductRubideum = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { amount } = req.body;

  const user = await User.findById(userId);

  if (
    !user.payId ||
    !user.uniqueId ||
    user.payId === "" ||
    user.uniqueId === ""
  ) {
    res.status(400);
    throw new Error("Please send the payId and uniqueId");
  }

  // API to fetch the current market value of Rubideum
  const currentValueResponse = await axios.get(
    "https://pwyfklahtrh.rubideum.net/api/endPoint1/RBD_INR"
  );

  const currentValue = currentValueResponse.data.data.last_price;

  // Rubideum to pass
  const rubideumToPass = amount / currentValue;

  // API to deduct balance
  const response = await axios.post(
    "https://pwyfklahtrh.rubideum.net/basic/deductBalanceAuto",
    {
      payId: user.payId,
      uniqueId: user.uniqueId,
      amount: rubideumToPass,
      currency: "RBD",
    }
  );

  const dataFetched = response.data;

  if (dataFetched.success === 1) {
    res.status(200).json({
      sts: "01",
      msg: "Rubideum deducted successfully",
      rubideumToPass,
    });
  } else {
    res.status(400).json({
      sts: "00",
      msg: "Deducting Rubideum failed. Check your Rubideum balance",
    });
  }
});

const performanceIncome = async (user) => {
  // Get the direct referred users
  const referredUsers = user.referrals;
  const packageCounts = {};

  if (referredUsers.length !== 0) {
    // Fetch each referred user and check his package selected. Take the total count of each package selected
    // and will be stored in the packageCounts.

    referredUsers.forEach((user) => {
      if (user.packageName) {
        user.packageName.forEach((packageName) => {
          packageCounts[packageName] = (packageCounts[packageName] || 0) + 1;
        });
      }
    });

    // Fetch those packages from database
    const packages = await Package.find({
      packageSlug: { $in: Object.keys(packageCounts) },
    });

    if (packages) {
      // Check if the package count is greater than the performanceIncomeCount of the package
      // and push to performanceClub if it meets the requirement.

      packages.forEach(async (eachPackage) => {
        const packageName = eachPackage.packageSlug;
        const packageCount = packageCounts[packageName];
        const performanceIncomeCount = eachPackage.performanceIncomeCount;
        const rankName = eachPackage.performanceIncomeName;

        console.log(performanceIncomeCount);

        if (performanceIncomeCount > packageCount) {
          console.log(`${packageName} does not meet the requirement.`);
        } else {
          console.log(`${packageName} meets the requirement.`);

          const performanceClubData = {
            packageName,
            rankName,
            status: true,
          };
          // Check if packageName already exists in the performanceClub array

          const packageExists = user.performanceClub.some(
            (item) => item.packageName === performanceClubData.packageName
          );

          // If packageName doesn't exist, push the new object
          if (!packageExists) {
            user.performanceClub.push(performanceClubData);
          }
        }
      });

      await user.save();
      return;
    } else {
      console.log("No packages found");
      return;
    }
  } else {
    console.log("No referred users");
    return;
  }
};

const teamPerformanceIncomeFn = async (user, teamLevel) => {
  console.log(`user is ${user}`);
  console.log(`teamLevel is ${teamLevel}`);
  let packageCount = {};

  teamPerformanceIncome(user, teamLevel, packageCount);
  console.log(packageCount);

  const packages = await Package.find();
  if (packages) {
    // Check if the package count is greater than the performanceIncomeCount of the package
    // and push to performanceClub if it meets the requirement.

    packages.forEach(async (eachPackage) => {
      const packageName = eachPackage.packageSlug;
      const teamPerformanceIncomeCount = eachPackage.teamPerformanceIncomeCount;
      const rankName = eachPackage.teamPerformanceIncomeName;

      const thisPackageCount = packageCount[packageName];

      if (teamPerformanceIncomeCount > thisPackageCount) {
        console.log(`${packageName} does not meet the requirement.`);
      } else {
        console.log(`${packageName} meets the requirement.`);

        const teamPerformanceClubData = {
          packageName,
          rankName,
          status: true,
        };
        // Check if packageName already exists in the teamPerformanceClub array

        const packageExists = user.teamPerformanceClub.some(
          (item) => item.packageName === teamPerformanceClubData.packageName
        );

        // If packageName doesn't exist, push the new object
        if (!packageExists) {
          user.performanceClub.push(teamPerformanceClubData);
        } else {
          console.log("Package already exists");
          return;
        }
      }
    });

    await user.save();
    return;
  } else {
    console.log("No packages found");
    return;
  }
};

const teamPerformanceIncome = async (user, teamLevel, packageCount) => {
  // Base case: If user is null or teamLevel is 0, return
  if (!user || teamLevel === 0) {
    return;
  }

  // Get the direct referred users
  const referredUsers = user.referrals;

  console.log(referredUsers);

  // Process each referred user
  for (const referredUser of referredUsers) {
    // Process the referred user here
    const packagesOfUser = referredUser.packageName;

    if (packagesOfUser) {
      packagesOfUser.forEach((eachPackage) => {
        packageCount[eachPackage] = (packageCount[eachPackage] || 0) + 1;
      });

      console.log(`packageCount is ${packageCount}`);
      // Recursive call to traverse through referred user's team
      await teamPerformanceIncome(referredUser, teamLevel - 1, packageCount);
    } else {
      console.log("No packages found");
      return;
    }
  }
};

// Verify user API
export const verifyUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Send the original amount and the package selected.
  let { amount, packageId } = req.body;

  if (!amount || !packageId) {
    res
      .status(400)
      .json({ sts: "00", msg: "Please send the amount and package" });
  } else {
    // Convert the amount type to number
    const newAmount = parseFloat(amount);

    // Get the package
    const selectedPackage = await Package.findById(packageId);
    if (!selectedPackage) {
      res.status(400).json({ sts: "00", msg: "Please select a valid package" });
    } else {
      // Find the user
      const user = await User.findById(userId);

      if (user) {
        user.isAccountVerified = true;
        user.packageSelected = packageId;

        // Check if the user has selected the package before.
        if (!user.packageName.includes(selectedPackage.packageSlug)) {
          // Check if the userId is already present in
          if (!selectedPackage.users.includes(userId)) {
            // Add the user to selected package
            selectedPackage.users.push(userId);

            // Total monthly divident distributed
            let totalMonthlyDivident = 0;

            // Push the packageSlug into the array
            user.packageName.push(selectedPackage.packageSlug);

            const updatedPackage = await selectedPackage.save();

            // Add the amount to global revenue database
            const revenue = await Revenue.findOne({});
            let newAmountToaddToMonth = 0;
            let newAmountToaddToTotal = 0;
            if (revenue) {
              newAmountToaddToMonth = parseFloat(
                revenue.monthlyRevenue + newAmount
              ).toFixed(2);
              newAmountToaddToTotal = parseFloat(
                revenue.totalRevenue + newAmount
              ).toFixed(2);
            } else {
              newAmountToaddToMonth = newAmount;
              newAmountToaddToTotal = newAmount;
            }

            revenue.monthlyRevenue = newAmountToaddToMonth;
            revenue.totalRevenue = newAmountToaddToMonth;

            const updatedRevenue = await revenue.save();

            if (updatedRevenue) {
              // Split the revenue to the premium users

              // Get the packages
              const packages = await Package.find({})
                .populate("users")
                .select("-benefits");

              if (packages) {
                // Select each package. Each package will have memberProfit. Divide the monthly revenue to each users in that package
                packages.forEach(async (eachPackage) => {
                  // Calculate the memberProfit
                  // monthly revenue * (member profit/100)
                  const memberProfit = parseFloat(
                    newAmount * (eachPackage.memberProfit / 100)
                  );

                  console.log("newAmount", newAmount);
                  console.log("memberProfit", memberProfit);
                  console.log("package", eachPackage.packageName);

                  // Save this value to monthlyDivident in the package
                  eachPackage.monthlyDivident = parseFloat(
                    eachPackage.monthlyDivident + memberProfit
                  ).toFixed(4);

                  totalMonthlyDivident += memberProfit;

                  eachPackage.usersCount = eachPackage.users.length;

                  const updatePackage = await eachPackage.save();

                  if (updatePackage) {
                    console.log("updatePackage", updatePackage.packageName);
                  }
                });
              }
            } else {
              res
                .status(400)
                .json({ sts: "00", msg: "Failed to update revenue" });
            }

            // Show amount spend transaction in user's transactions
            user.transactions.push({
              amount,
              typeofTransaction: "debit",
              kind: `Package purchased`,
              fromWhom: "self",
              status: "approved",
            });

            // Fetch the percentages level set from admin side
            const level = await Level.findOne();

            if (!level) {
              res.status(400).json("Please create a level first");
            } else {
              const percentageArray = level.levelPercentages;

              let percentages = [];
              percentageArray.map((item) => {
                percentages.push(item.percentage);
              });

              // Do split commission using loop
              const userName = user.firstName + " " + user.lastName;
              let currentUser = user.sponsor;
              let totalCommission = 0;
              let teamLevel = percentages.length;

              const updatedUser = await user.save();
              // Split the commission to users in the level tree based on the percentages
              while (currentUser && percentages.length > 0) {
                if (!currentUser) {
                  break;
                }

                const sponsor = await User.findById(currentUser);

                if (!sponsor) {
                  break;
                }

                // Get the first of the percentages
                const commission = amount * (percentages[0] / 100);

                // Get the total commission inorder to move the balance to admin's payId
                totalCommission += commission;

                // Add the wallet amount to each user's wallet
                if (!sponsor.walletAmount) {
                  sponsor.walletAmount = commission;
                } else {
                  sponsor.walletAmount += commission;
                }

                // Update user's referral amount
                if (!sponsor.totalReferralAmount) {
                  sponsor.totalReferralAmount = commission;
                } else {
                  sponsor.totalReferralAmount += commission;
                }

                // Push the credit transaction to each user
                sponsor.transactions.push({
                  amount: commission,
                  typeofTransaction: "credit",
                  kind: "Level commission",
                  fromWhom: userName,
                  level: percentages.length,
                  percentage: percentages[0],
                  status: "approved",
                });

                if (!sponsor.overallAmount) {
                  sponsor.overallAmount = commission;
                } else {
                  sponsor.overallAmount += commission;
                }

                // Save the user's database
                const updateSponsor = await sponsor.save();
                teamPerformanceIncomeFn(updateSponsor, teamLevel);

                if (updateSponsor) {
                  if (sponsor.sponsor === null) {
                    break;
                  } else {
                    currentUser = sponsor.sponsor;
                    percentages = percentages.slice(1);
                  }
                }
              }

              // Update the remaining amount to the payId: RBD004779237
              const remainingAmount =
                newAmount - (totalCommission + totalMonthlyDivident);

              const payId = "RBD004779237";
              const uniqueId = "66000acbcfaa5d4ccb97b313";

              const response = await axios.post(
                "https://pwyfklahtrh.rubideum.net/basic/creditBalanceAuto",
                { payId, uniqueId, amount: remainingAmount, currency: "RBD" }
              );

              if (response.data.success === 1) {
                console.log("Successfully added to payId: RBD004779237");

                const updatedUser2 = await user.save();
                performanceIncome(updatedUser2);

                if (updatedUser && updatedUser2) {
                  // New income document
                  const newIncome = await Income.create({
                    userId: userId,
                    packageSelected: packageId,
                    levelIncome: parseFloat(totalCommission.toFixed(3)),
                    monthlyDivident: parseFloat(
                      totalMonthlyDivident.toFixed(3)
                    ),
                    adminProfit: parseFloat(remainingAmount.toFixed(3)),
                  });

                  if (newIncome) {
                    res
                      .status(200)
                      .json({ sts: "01", msg: "User verified successfully" });
                  }
                } else {
                  res.status(400).json({ sts: "00", msg: "User not verified" });
                }
              } else {
                console.log("Failed to add to payId: RBD004779237");
                res
                  .status(400)
                  .json({ sts: "00", msg: "Failed to add to payId" });
              }
            }
          } else {
            res.status(400).json({
              sts: "00",
              msg: "You have already added this package to packages database",
            });
          }
        } else {
          res.status(400).json({
            sts: "00",
            msg: "You have already selected this package",
          });
        }
      } else {
        res.status(404).json({ sts: "00", msg: "User not found" });
      }
    }
  }
});

// Get user profile
const convertDate = (originalDate) => {
  const day = originalDate.getDate();
  const month = originalDate.getMonth() + 1;
  const year = originalDate.getFullYear();

  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate;
};

export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .populate("packageSelected")
    .select("-password");
  let walletAmount = user.walletAmount;
  if (user) {
    const response = {
      sts: "01",
      msg: "Success",
      user: {
        ...user._doc,
        walletAmount: walletAmount.toFixed(4),
        updatedDOB: user.dateOfBirth
          ? convertDate(user.dateOfBirth)
          : convertDate(user.createdAt),
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
    };
    res.status(200).json(response);
  } else {
    res.status(404).json({ sts: "00", msg: "User not found" });
  }
});

// Upload Image
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ sts: "00", msg: "No file uploaded" });
  }

  const { description } = req.body;

  const { path: filePath, mimetype: fileType, filename: fileName } = req.file;

  const userId = req.user._id;

  const media = await Media.create({
    userId,
    fileType,
    fileName,
    description,
    filePath,
  });

  if (media) {
    res.status(201).json({ sts: "01", msg: "Image uploaded successfully" });
  } else {
    res.status(400).json({ sts: "00", msg: "Error in uploading image" });
  }
});

// Upload Video
export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ sts: "00", msg: "No file uploaded" });
  }

  const { description } = req.body;

  const { path: filePath, mimetype: fileType, filename: fileName } = req.file;

  const userId = req.user._id;

  const media = await Media.create({
    userId,
    fileType,
    fileName,
    description,
    filePath,
  });

  if (media) {
    res.status(201).json({ sts: "01", msg: "Video uploaded successfully" });
  } else {
    res.status(400).json({ sts: "00", msg: "Error in uploading image" });
  }
});

// Get all the media uploaded by the user
export const getMedia = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // const media = await Media.find({ userId }).populate(
  //   "userId",
  //   "firstName lastName",
  // ).sort({ createdAt: -1 });

  let media = await Media.find({ userId })
    .populate({
      path: "userId",
      select: "firstName lastName",
      populate: { path: "profilePic", select: "filePath" },
    })
    .sort({ createdAt: -1 });

  let result = [];
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5; // Default page size to 5 if not provided

  // Calculate the skip value
  const skip = (page - 1) * limit;

  if (media) {
    // Paginate the media
    media = media.slice(skip, skip + limit);

    for (const mediaData of media) {
      result.push({
        ...mediaData._doc,
        userId: mediaData.userId._id,
        firstName: mediaData.userId.firstName,
        lastName: mediaData.userId.lastName,
        profilePic: mediaData.userId.profilePic
          ? mediaData.userId.profilePic.filePath
          : null,
      });
    }
    res.status(200).json({
      sts: "01",
      msg: "Success",
      postCount: media.length,
      media: result,
    });
  } else {
    res.status(404).json({ sts: "00", msg: "No media found" });
  }
});

// Add payId and secret key
export const addPayId = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { payId, uniqueId } = req.body;

  if (!payId || !uniqueId) {
    res.status(400);
    throw new Error("Please send the payId and uniqueId");
  }

  const existingUser = await User.findById(userId);
  if (existingUser) {
    const user = await User.findByIdAndUpdate(
      userId,
      { payId, uniqueId, isVerified: true, nodeId: existingUser.sponsor },
      { new: true }
    );
    if (user) {
      res.status(200).json({ sts: "01", msg: "PayId added successfully" });
    } else {
      res.status(404).json({ sts: "00", msg: "User not found" });
    }
  } else {
    res.status(404).json({ sts: "00", msg: "User not found" });
  }
});

// Get the direct referred users' list
export const getDirectReferredUsers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default page size to 10 if not provided

  // Calculate the skip value
  const skip = (page - 1) * limit;

  const user = await User.findById(userId).populate({
    path: "referrals",
    select:
      "firstName lastName email phone isVerified isAccountVerified transactions",
  });

  if (user) {
    const referrals = user.referrals;

    // Paginate the referrals
    const paginatedReferrals = referrals.slice(skip, skip + limit);

    if (referrals) {
      res
        .status(200)
        .json({ sts: "01", msg: "Success", referrals: paginatedReferrals });
    } else {
      res.status(404).json({ sts: "00", msg: "No referrals found" });
    }
  } else {
    res.status(404).json({ sts: "00", msg: "User not found" });
  }
});

// Get the referral tree users count
async function getReferralTreeCount(user) {
  let count = 0;

  const referrals = await User.find({
    _id: { $in: user.referrals },
  });

  for (let referral of referrals) {
    count++;
    count += await getReferralTreeCount(referral);
  }

  return count;
}

export const refferalTreeCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (user) {
    const count = await getReferralTreeCount(user);
    res.status(200).json({ sts: "01", msg: "Success", count });
  } else {
    res.status(404).json({ sts: "00", msg: "User not found" });
  }
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error("Please send the password");
  }

  const user = await User.findOne({ email });

  if (user) {
    user.password = password;
    const updatedUser = await user.save();

    if (updatedUser) {
      res.status(200).json({ sts: "01", msg: "Password changed successfully" });
    } else {
      res.status(400).json({ sts: "00", msg: "Error in changing password" });
    }
  } else {
    res.status(404).json({ sts: "00", msg: "User not found" });
  }
});

// Sync unrealised to wallet amount
// export const syncWallet = asyncHandler(async (req, res) => {
//   const userid = req.user._id;

//   if (userid) {
//     const user = await User.findById(userid);

//     if (user) {
//       // API to credit balance
//       const response = await axios.post(
//         "https://pwyfklahtrh.rubideum.net/basic/creditBalanceAuto",
//         {
//           payId: user.payId,
//           uniqueId: user.uniqueId,
//           amount: user.walletAmount,
//           currency: "RBD",
//         }
//       );

//       const dataFetched = response.data;

//       if (dataFetched.success === 1) {
//         user.walletAmount = 0;
//         const updatedUser = await user.save();
//         if (updatedUser) {
//           res.status(200).json({
//             sts: "01",
//             msg: "Unrealised synced successfully",
//           });
//         } else {
//           res.status(400).json({ sts: "00", msg: "User not updated" });
//         }
//       } else {
//         res.status(400).json({ sts: "00", msg: "Error in syncing unrealised" });
//       }
//     } else {
//       res.status(400).json({ sts: "00", msg: "User not found" });
//     }
//   } else {
//     res.status(400).json({ sts: "00", msg: "Please login first" });
//   }
// });

// Get stats of number of users in each plan and the total amount to distribute
export const getStats = asyncHandler(async (req, res) => {
  // Fetch the package, populate users and take the sum of unrealisedMonthlyProfit of users
  const packages = await Package.find().populate("users").sort({ amount: 1 });

  console.log(packages);

  if (packages) {
    const memberProfits = [];

    for (let eachPackage of packages) {
      // Count of users
      const countOfUsers = eachPackage.users.length;

      const result = {
        packageSlug: eachPackage.packageSlug,
        packageName: eachPackage.packageName,
        memberProfit: eachPackage.memberProfit,
        amount: eachPackage.amount,
        usersCount: countOfUsers,
        splitAmount: eachPackage.monthlyDivident,
      };

      memberProfits.push(result);
    }
    res.status(200).json({ sts: "01", msg: "Success", memberProfits });
  } else {
    res.status(400).json({ sts: "00", msg: "No data found" });
  }
});

// Convert INR to rubidya
export const convertINR = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  // Get current rubidya market place
  const response = await axios.get(
    "https://pwyfklahtrh.rubideum.net/api/endPoint1/RBD_INR"
  );

  const currentValue = response.data.data.last_price;

  if (currentValue) {
    const convertedAmount = amount / currentValue;
    if (convertedAmount) {
      res.status(200).json({
        sts: "01",
        msg: "Converted successfully",
        convertedAmount,
      });
    } else {
      res.status(400).json({ sts: "00", msg: "Calculation failed" });
    }
  } else {
    res.status(400).json({ sts: "00", msg: "Error in converting" });
  }
});

// Edit user profile
export const editUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const {
    firstName,
    lastName,
    email,
    countryCode,
    phone,
    bio,
    profession,
    gender,
    dateOfBirth,
    location,
    district,
  } = req.body;

  // Edit other details
  const user = await User.findById(userId);

  if (user) {
    const updateUser = await User.findByIdAndUpdate(userId, {
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      phone: phone || user.phone,
      countryCode: countryCode || user.countryCode,
      bio: bio || user.bio,
      profession: profession || user.profession,
      gender: gender || user.gender,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      location: location || user.location,
      district: district || user.district,
    });

    if (updateUser) {
      res.status(200).json({ sts: "01", msg: "User updated successfully" });
    } else {
      res.status(400).json({ sts: "00", msg: "User not updated" });
    }
  } else {
    res.status(400).json({ sts: "00", msg: "User not found" });
  }
});

// Upload profile picture
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ sts: "00", msg: "No file uploaded" });
  } else {
    const { path: filePath, mimetype: fileType, filename: fileName } = req.file;

    const userId = req.user._id;

    const profilePic = await ProfilePic.findOneAndUpdate(
      { userId: userId },
      { fileType: fileType, fileName: fileName, filePath: filePath },
      { upsert: true, new: true }
    );

    // Update user with profilePic id
    const updateUser = await User.findByIdAndUpdate(userId, {
      $set: { profilePic: profilePic._id },
    });

    if (profilePic && updateUser) {
      res.status(201).json({ sts: "01", msg: "Image uploaded successfully" });
    } else {
      res.status(400).json({ sts: "00", msg: "Error in uploading image" });
    }
  }
});

// Get user profile picture
export const getProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profilePic = await ProfilePic.findOne({ userId: userId });

  if (profilePic) {
    res.status(200).json({
      sts: "01",
      msg: "Profile picture fetched successfully",
      profilePic,
    });
  } else {
    res
      .status(200)
      .json({ sts: "00", msg: "No profile picture found", profilePic });
  }
});

// Follow a person
export const follow = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { followerId } = req.body;

  const user = await User.findById(userId);

  if (user.following.includes(followerId)) {
    res.status(400).json({ sts: "00", msg: "Already following" });
  } else {
    user.following.push(followerId);
    const updateUser = await user.save();

    const updateFollower = await User.findByIdAndUpdate(
      followerId,
      {
        $push: { followers: userId },
      },
      { new: true }
    );

    if (updateUser && updateFollower) {
      res.status(200).json({ sts: "01", msg: "Followed successfully" });
    } else {
      res.status(400).json({ sts: "00", msg: "Error in following" });
    }
  }
});

// Unfollow a person
export const unfollow = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { followerId } = req.body;

  const user = await User.findById(userId);

  if (!user.following.includes(followerId)) {
    res.status(400).json({ sts: "00", msg: "Not following" });
  } else {
    const updateUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { following: followerId },
      },
      { new: true }
    );

    // Update follower
    const updateFollower = await User.findByIdAndUpdate(
      followerId,
      {
        $pull: { followers: userId },
      },
      { new: true }
    );

    if (updateUser && updateFollower) {
      res.status(200).json({ sts: "01", msg: "Unfollowed successfully" });
    } else {
      res.status(400).json({ sts: "00", msg: "Error in unfollowing" });
    }
  }
});

// Get user suggestions
export const getSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get the following
  const user = await User.findById(userId).select("following");

  const following = user.following;

  // Get users in the order to get 20 results

  // Define a function to shuffle array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Fetch all users
  const allUsers = await User.find({})
    .populate({
      path: "profilePic",
      select: "filePath",
    })
    .select("firstName lastName isAccountVerified profilePic");

  // Shuffle the users array
  const shuffledUsers = shuffleArray(allUsers);

  // Limit the result to 20 users
  const users = shuffledUsers.slice(0, 20);

  if (users) {
    const result = [];
    users.forEach((user) => {
      // Check if user is already following
      if (following.includes(user._id)) {
        user.isFollowing = true;
      } else {
        user.isFollowing = false;
      }
      result.push({ ...user._doc, isFollowing: user.isFollowing });
    });
    if (result) {
      res
        .status(200)
        .json({ sts: "01", msg: "Suggestions fetched successfully", result });
    } else {
      res.status(400).json({ sts: "00", msg: "No suggestions found" });
    }
  } else {
    res.status(400).json({ sts: "00", msg: "No suggestions found" });
  }
});

// Get the following
export const getFollowing = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default page size to 10 if not provided

  // Calculate the skip value
  const skip = (page - 1) * limit;

  let user = await User.findById(userId)
    .select("following")
    .populate({
      path: "following",
      select: "firstName lastName profilePic",
      populate: { path: "profilePic", select: "filePath" },
    });

  let following = user.following;

  // Paginate the following users
  following = following.slice(skip, skip + limit);
  if (user) {
    res.status(200).json({
      sts: "01",
      msg: "Following fetched successfully",
      following: following,
    });
  } else {
    res.status(400).json({ sts: "00", msg: "No following found" });
  }
});

// Get the followers
export const getFollowers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let user = await User.findById(userId)
    .select("followers")
    .populate({
      path: "followers",
      select: "firstName lastName profilePic followers",
      populate: { path: "profilePic", select: "filePath" },
    });
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default page size to 10 if not provided

  // Calculate the skip value
  const skip = (page - 1) * limit;
  user = user.followers;

  // Paginate the followed users
  user = user.slice(skip, skip + limit);

  console.log("USERR", user);
  if (user) {
    const result = [];
    user.forEach((eachUser) => {
      // Check if user is already following
      if (eachUser.followers.includes(userId)) {
        eachUser.isFollowing = true;
      } else {
        eachUser.isFollowing = false;
      }
      result.push({
        ...eachUser._doc,
        isFollowing: eachUser.isFollowing,
      });
    });

    res.status(200).json({
      sts: "01",
      msg: "Followers fetched successfully",
      followers: result,
    });
  } else {
    res.status(400).json({ sts: "00", msg: "No following found" });
  }
});

// Search in all users
export const findAllUser = asyncHandler(async (req, res) => {
  //Fetching userId
  const userId = req.user._id;

  //Fetching data of all user
  const users = await User.find()
    .select("firstName lastName profilePic followers")
    .populate({ path: "profilePic", select: "filePath" });

  if (users) {
    const result = [];
    users.forEach((user) => {
      // Check if user is already following
      if (user.followers.includes(userId)) {
        user.isFollowing = true;
      } else {
        user.isFollowing = false;
      }
      result.push({ ...user._doc, isFollowing: user.isFollowing });
    });

    res
      .status(200)
      .json({ sts: "01", msg: "Users data fetched successfully", result });
  } else {
    res.status(400).json({ sts: "00", msg: "No User found" });
  }
});

//Get user detail
export const findOnesDetail = asyncHandler(async (req, res) => {
  //Fetching userId
  const userId = req.params.id;
  //Fetching data of a user
  const users = await User.findById(userId)
    .select("firstName lastName bio  profilePic followers following ")
    .populate({ path: "profilePic", select: "filePath" });

  if (users) {
    const result = [];

    // Check if user is already following
    if (users.followers.includes(req.user._id)) {
      users.isFollowing = true;
    } else {
      users.isFollowing = false;
    }

    //Fetching media datas of user
    const media = await Media.find({ userId: userId }).select(
      "filePath likeCount"
    );

    // result.push({
    //   ...users._doc,
    //   isFollowing: users.isFollowing,
    //   profilePic: users.profilePic ? users.profilePic.filePath : null,
    //   isFollowing: users.isFollowing,
    //   followers: users.followers.length,
    //   following: users.following.length,
    //   post: media.length,
    //   media: media,
    // });

    for (const mediaData of media) {
      result.push({
        ...mediaData._doc,
        userId: users._id,
        firstName: users.firstName,
        lastName: users.lastName,
        following: users.following,
        followers: users.followers,
        isFollowing: users.isFollowing,
        profilePic: users.profilePic ? users.profilePic.filePath : null,
        isFollowing: users.isFollowing,
        followers: users.followers.length,
        following: users.following.length,
        bio: users.bio,
        post: media.length,
      });
    }

    res.status(200).json({
      sts: "01",
      msg: "Users data fetched successfully",
      media: result,
    });
  } else {
    res.status(400).json({ sts: "00", msg: "No User found" });
  }
});

// Upload video
// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/videos/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000000000000000000 }, // Set file size limit if needed
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("video"); // 'video' is the name attribute of the file input field

// Check file type
function checkFileType(file, cb) {
  const filetypes = /mp4|avi|mkv|mov|wmv/; // Add more file types if needed
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Videos only!");
  }
}

//Function to handle video upload
export const videoUpload = asyncHandler(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error(err);
      res.status(400).send("Error uploading file!");
    } else {
      if (req.file == undefined) {
        res.status(400).send("No file selected!");
      } else {
        const createMedia = await Media.create({
          userId: req.user._id,
          fileType: req.file.mimetype,
          fileName: req.file.filename,
          filePath: req.file.path,
        });

        res.send("File uploaded successfully!");
      }
    }
  });
});

//Function to get stories of a user
export const getStory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  //Fetching data from media against userId and story:true
  const media = await Media.find({ userId, story: true });

  //Subtracting 24 hours from current time inorder to get only 24 hours feed of user
  let subtractedTime = moment().subtract(24, "hours");

  //Formatting the subtracted time
  let formattedSubtractedTime = subtractedTime.format("YYYY-MM-DD,HH:mm:ss");

  let mediaData = [];

  //Maping through the media data
  for (const data of media) {
    //Formatting created time of media
    let mediaFormattedTime = moment(data.createdAt).format(
      "YYYY-MM-DD,HH:mm:ss"
    );

    //Checking the condition
    if (mediaFormattedTime > formattedSubtractedTime) {
      mediaData.push(data);
    }
  }
  if (media) {
    res.status(200).json({ sts: "01", msg: "Success", media: mediaData });
  } else {
    res.status(404).json({ sts: "00", msg: "No media found" });
  }
});

// Block a user
export const blockAUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get the user details
  const user = await User.findById(userId);

  if (user) {
    // Update the user with the blocked user
    let updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: { blockedUsers: req.body.user },
        $inc: { blockedCount: 1 },
      },
      { new: true }
    );
    if (updatedUser) {
      //Removing blocked users id from followers list ,if user is followed by the blocked user
      if (updatedUser.followers.includes(req.body.user)) {
        updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $pull: { followers: req.body.user },
          },
          { new: true }
        );
      }

      //Removing blocked users id from following list ,if user is following  blocked user
      if (updatedUser.following.includes(req.body.user)) {
        updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $pull: { following: req.body.user },
          },
          { new: true }
        );
      }
      res.status(201).json({
        sts: "01",
        msg: "User updated successfully",
        user: updatedUser,
      });
    } else {
      res.status(400).json({
        sts: "00",
        msg: "User not updated",
      });
    }
  } else {
    res.status(400).json({
      sts: "00",
      msg: "User not found",
    });
  }
});

// Search in all following users
export const searchAllFollowing = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let userId = req.user._id;

  //Get users following user details
  let user = await User.findById(userId)
    .select("following")
    .populate({
      path: "following",
      select: "firstName lastName profilePic",
      populate: { path: "profilePic", select: "filePath" },
    });

  let searchText = req.query.search.toLowerCase();
  const regex = new RegExp(`^${searchText}`, "i"); // Case-insensitive regex that matches text starting with searchText

  // Search by firstName or lastName
  user = user.following.filter(
    (user) =>
      regex.test(user.firstName.toLowerCase()) ||
      regex.test(user.lastName.toLowerCase())
  );

  if (user) {
    res.status(200).json({ sts: "01", msg: "Fetched successfully", user });
  } else {
    res.status(404).json({ message: "No users found" });
  }
});

// Search in all followers users
export const searchAllFollowers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let userId = req.user._id;

  //Get users followers user details
  let user = await User.findById(userId)
    .select("followers")
    .populate({
      path: "followers",
      select: "firstName lastName profilePic",
      populate: { path: "profilePic", select: "filePath" },
    });

  let searchText = req.query.search.toLowerCase();
  const regex = new RegExp(`^${searchText}`, "i"); // Case-insensitive regex that matches text starting with searchText

  // Search by firstName or lastName
  user = user.followers.filter(
    (user) =>
      regex.test(user.firstName.toLowerCase()) ||
      regex.test(user.lastName.toLowerCase())
  );

  if (user) {
    res.status(200).json({ sts: "01", msg: "Fetched successfully", user });
  } else {
    res.status(404).json({ message: "No users found" });
  }
});

//Report account
export const reportAccount = asyncHandler(async (req, res) => {
  //Create a record in report table
  const report = await Report.create({
    reportType: req.body.type,
    decription: req.body.decription,
    blockedBy: req.user._id,
    blockedUser: req.body.user,
  });

  if (report) {
    res.status(200).json({ sts: "01", msg: "Account reported successfully" });
  } else {
    res.status(400).json({
      status: "00",
      msg: "Cannot report",
    });
  }
});

//Deleting an image
export const deleteImage = asyncHandler(async (req, res) => {
  const image = req.query.imageId;

  // Use findOneAndDelete() to find and delete the media by ID
  const deletedMedia = await Media.findOneAndDelete({ _id: image });
  console.log("SAJ", deletedMedia);
  if (deletedMedia) {
    res.status(201).json({ sts: "01", msg: "Image deleted successfully" });
  } else {
    res.status(400).json({ sts: "00", msg: "No image found" });
  }
});

export const getFundHistory = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const user = await User.findById(userId).select("fundHistory");

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default page size to 10 if not provided

  // Calculate the skip value
  const skip = (page - 1) * limit;
  let history = user.fundHistory;

  if (user) {
    // Paginate the posts
    history = history.slice(skip, skip + limit);

    res.status(200).json({
      status: "01",
      msg: "Success",
      history,
    });
  } else {
    res.status(404).json({ sts: "00", msg: "User not found" });
  }
});

//Function to get transaction history of user
export const getTransactionHistory = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  //Fetching transaction history of user
  const user = await User.findById(userId).select("transactions");

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default page size to 10 if not provided

  // Calculate the skip value
  const skip = (page - 1) * limit;

  let result = [];
  let history = user.transactions;

  // Paginate the history
  history = history.slice(skip, skip + limit);
  let amount;

  //Looping through the transaction history
  for (const data of history) {
    amount = data.amount.toFixed(4);

    result.push({
      ...data._doc,
      amount: amount,
    });
  }
  if (user) {
    res.status(200).json({
      status: "01",
      msg: "Success",
      result,
    });
  } else {
    res.status(404).json({ sts: "00", msg: "User not found" });
  }
});

//get feed (ads from admin)
export const getFeed = asyncHandler(async (req, res) => {
  //Fetching feed data
  const feedData = await Feed.find({});

  if (feedData) {
    res.status(200).json({
      sts: "01",
      msg: "feed fetched successfully",
      feeds: feedData,
    });
  } else {
    res.status(400).json({ sts: "00", msg: "No feeds found" });
  }
});
