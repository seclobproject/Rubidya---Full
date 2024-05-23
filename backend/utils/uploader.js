import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import multer from "multer";
import asyncHandler from "../middleware/asyncHandler.js";
import sharp from "sharp";
import path from "path";



// Generate random string
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

// Set up AWS credentials
const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIA4MPBM56LHZHD34F4",
    secretAccessKey: "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",
  },
});

const storage = multer.memoryStorage();

// Multer configuration
export const uploader = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file type
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Video uploader
export const videoUploader = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(mp4|avi|mkv|mov|wmv)$/)) {
      return cb(new Error("Only video files are allowed!"), false);
    }
    cb(null, true);
  },
});

export const uploadAndCompressVideo = asyncHandler(async (req, res, next) => {

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  // Generate random filename
  const timestamp = Date.now();
  const randomString = generateRandomString(10); // Adjust length as needed
  const extension = path.extname(req.file.originalname);
  const randomFilename = `${timestamp}-${randomString}${extension}`;

  try {
    const uploadParams = {
      client: s3Client,
      params: {
        Bucket: "rubidya",
        Key: `video/${randomFilename}`,
        Body: req.file.buffer,
      },
    };

    const uploader = new Upload(uploadParams);

    try {
      const uploadResult = await uploader.done();
      console.log("File uploaded successfully:", uploadResult.Location);

      // Add properties to req.file
      req.file.path = uploadResult.Location; // Example path
      req.file.filename = randomFilename;
      req.file.mimetype = "video/mp4";

      next();
    } catch (error) {
      console.error("Error uploading file:", err);
      res.status(500).send("Failed to upload file");
    }
  } catch (error) {
    console.error("Error processing image:", error);
    return res.status(500).json({ sts: "00", msg: "Error processing image" });
  }
});

// Define a route to handle file uploads
export const uploadAndCompress = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  try {

    // Resize and compress image
    const compressedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1000 }) // Resize to desired width
      .jpeg({ quality: 90 }) // Compress to JPEG format with specified quality
      // .jpeg({ quality: 90, progressive: true, chromaSubsampling: '4:4:4' })
      .toBuffer(); // Convert the image to a buffer

    // Generate random filename
    const timestamp = Date.now();
    const randomString = generateRandomString(10); // Adjust length as needed
    const extension = path.extname(req.file.originalname);
    const randomFilename = `${timestamp}-${randomString}${extension}`;

    const uploadParams = {
      client: s3Client,
      params: {
        Bucket: "rubidya",
        Key: `images/${randomFilename}`,
        Body: compressedBuffer,
        // Body: req.file.buffer
      },
    };

    const uploader = new Upload(uploadParams);

    try {
      const uploadResult = await uploader.done();
      console.log("File uploaded successfully:", uploadResult.Location);

      // Add properties to req.file
      req.file.path = uploadResult.Location; // Example path
      req.file.filename = randomFilename;
      req.file.mimetype = "image/jpeg"; // Adjust as necessary
      req.file.key = uploadResult?.Key
      req.file.buffer = compressedBuffer; // Replace the original buffer with the compressed one

      next();
      // res.status(200).send("File uploaded");
    } catch (err) {
      console.error("Error uploading file:", err);
      res.status(500).send("Failed to upload file");
    }
  } catch (error) {
    console.error("Error processing image:", error);
    return res.status(500).json({ sts: "00", msg: "Error processing image" });
  }
});

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

    const uploadParams = {
      client: s3Client,
      params: {
        Bucket: "rubidya",
        Key: `profilePic/${randomFilename}`,
        Body: compressedBuffer,
      },
    };

    const uploader = new Upload(uploadParams);

    try {
      const uploadResult = await uploader.done();
      console.log("File uploaded successfully:", uploadResult.Location);

      // Add properties to req.file
      req.file.path = uploadResult.Location; // Example path
      req.file.filename = randomFilename;
      req.file.mimetype = "image/jpeg"; // Adjust as necessary

      req.file.buffer = compressedBuffer; // Replace the original buffer with the compressed one

      next();
      // res.status(200).send("File uploaded");
    } catch (err) {
      console.error("Error uploading file:", err);
      res.status(500).send("Failed to upload file");
    }
  } catch (error) {
    console.error("Error processing image:", error);
    return res.status(500).json({ sts: "00", msg: "Error processing image" });
  }
};

export const deleteFromS3 = async (key) => {
  try {
    const deleteParams = {
      Bucket: "rubidya",
      Key: key,
    };
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log("File deleted successfully from S3");
    return true
  } catch (err) {
    console.error("Error deleting file from S3:", err);
    return false
  }
};