import asyncHandler from "../middleware/asyncHandler.js";
import Package from "../models/packageModel.js";
import User from "../models/userModel.js";

// Add new package by admin
export const addPackage = asyncHandler(async (req, res) => {
  const { packageName, amount, memberProfit, benefits } = req.body;

  const packageSlug = packageName.toLowerCase().split(" ").join("-");

  // check if package of same slug exists
  const packageExists = await Package.findOne({ packageSlug });

  if (packageExists) {
    res.status(400).json({
      sts: "00",
      msg: "Package already exists",
    });
  } else {
    const addPackage = await Package.create({
      packageName,
      amount,
      memberProfit,
      benefits,
      packageSlug,
    });

    if (addPackage) {
      res.status(201).json({
        message: "Package added successfully",
      });
    } else {
      res.status(400).json({
        message: "Package not added",
      });
    }
  }
});

// Edit the package by admin
export const editPackage = asyncHandler(async (req, res) => {
  const { packageId, packageName, amount, memberProfit, benefits } = req.body;

  const selectedPackage = await Package.findById(packageId);

  if (selectedPackage) {
    if (packageName.length > 0) {
      // New package-slug
      const packageSlug = packageName.toLowerCase().split(" ").join("-");

      // Old package-slug
      const existingPackageSlug = selectedPackage.packageSlug;

      // Change the package name in user document
      const result = await User.updateMany(
        { packageName: existingPackageSlug },
        { $set: { "packageName.$[elem]": packageSlug } },
        { arrayFilters: [{ elem: existingPackageSlug }] }
      );

      selectedPackage.packageSlug = packageSlug || selectedPackage.packageSlug;
    }

    selectedPackage.packageName = packageName || selectedPackage.packageName;
    selectedPackage.amount = amount || selectedPackage.amount;
    selectedPackage.memberProfit = memberProfit || selectedPackage.memberProfit;
    selectedPackage.benefits = benefits || selectedPackage.benefits;

    const updatedPackage = await selectedPackage.save();

    if (updatedPackage) {
      res.status(201).json({
        sts: "01",
        msg: "Package updated successfully",
      });
    } else {
      res.status(400).json({
        sts: "00",
        msg: "Package not updated",
      });
    }
  } else {
    res.status(400).json({
      sts: "00",
      msg: "Package not updated",
    });
  }
});

// Get all packages
export const getAllPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find().sort({ amount: 1 });

  if (packages) {
    res.status(200).json({ sts: "01", msg: "Success", packages });
  } else {
    res.status(404).json({ sts: "00", msg: "No packages found" });
  }
});

// Get package by ID
export const getPackageById = asyncHandler(async (req, res) => {
  const { packageId } = req.body;

  const singlePackage = await Package.findById(packageId);

  if (singlePackage) {
    res.status(200).json({ sts: "01", msg: "Success", singlePackage });
  } else {
    res.status(404).json({ sts: "00", msg: "No package found" });
  }
});

// Select a package
export const selectPackage = asyncHandler(async (req, res) => {
  const { packageId } = req.body;
  const userId = req.user.id;

  // Get the package
  const selectedPackage = await Package.findById(packageId);

  // Update the user with the package
  const updatedUser = await User.findByIdAndUpdate(userId, {
    packageSelected: packageId,
    packageName: selectedPackage.packageSlug,
  });

  if (updatedUser) {
    // Push the user to the users in package
    const selectedPackage = await Package.findByIdAndUpdate(packageId, {
      $push: { users: userId },
    });

    if (selectedPackage) {
      res.status(201).json({
        sts: "01",
        msg: "User updated successfully",
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
      msg: "User not updated",
    });
  }
});
