const generateRandomString = (length) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

import multer from "multer";
import path from "path";
import sharp from "sharp"; // Import Sharp for image compression
import fs from "fs";

const storage = multer.memoryStorage(); // Store the file in memory for processing

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file type
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Middleware to resize and compress images before saving
export const resizeAndCompressImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ sts: "00", msg: "No file uploaded" });
  }

  try {
    // Resize and compress image
    const compressedBuffer = await sharp(req.file.buffer)
      .resize({ width: 800 }) // Resize to desired width
      .jpeg({ quality: 80 }) // Compress to JPEG format with specified quality
      .toBuffer(); // Convert the image to a buffer

    // Generate random filename
    const timestamp = Date.now();
    const randomString = generateRandomString(10); // Adjust length as needed
    const extension = path.extname(req.file.originalname);
    const randomFilename = `${timestamp}-${randomString}${extension}`;

    // Write compressed image buffer to disk
    try {
      fs.writeFileSync(
        `/var/www/seclob/rubidya/uploads/${randomFilename}`,
        // `uploads/${randomFilename}`,
        compressedBuffer
      );
    } catch (error) {
      console.error(error);
    }

    // Add properties to req.file
    req.file.path = `uploads/${randomFilename}`; // Example path
    req.file.filename = randomFilename;
    req.file.mimetype = "image/jpeg"; // Adjust as necessary

    req.file.buffer = compressedBuffer; // Replace the original buffer with the compressed one

    next(); // Move to the next middleware
  } catch (error) {
    console.error("Error processing image:", error);
    return res.status(500).json({ sts: "00", msg: "Error processing image" });
  }
};

// Middleware to resize and compress images before saving for profile picture
export const resizeAndCompressImageForProfilePic = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ sts: "00", msg: "No file uploaded" });
  }

  try {
    // Resize and compress image
    const compressedBuffer = await sharp(req.file.buffer)
      .resize({ width: 600 }) // Resize to desired width
      .jpeg({ quality: 80 }) // Compress to JPEG format with specified quality
      .toBuffer(); // Convert the image to a buffer

    // Generate random filename
    const timestamp = Date.now();
    const randomString = generateRandomString(10); // Adjust length as needed
    const extension = path.extname(req.file.originalname);
    const randomFilename = `${timestamp}-${randomString}${extension}`;

    // Write compressed image buffer to disk
    try {
      fs.writeFileSync(
        `/var/www/seclob/rubidya/uploads/profilePic/${randomFilename}`,
        // `uploads/profilePic/${randomFilename}`,
        compressedBuffer
      );
    } catch (error) {
      console.error(error);
    }

    // Add properties to req.file
    req.file.path = `uploads/profilePic/${randomFilename}`; // Example path
    req.file.filename = randomFilename;
    req.file.mimetype = "image/jpeg"; // Adjust as necessary

    req.file.buffer = compressedBuffer; // Replace the original buffer with the compressed one

    next(); // Move to the next middleware
  } catch (error) {
    console.error("Error processing image:", error);
    return res.status(500).json({ sts: "00", msg: "Error processing image" });
  }
};
