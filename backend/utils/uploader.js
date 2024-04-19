import { S3Client } from "@aws-sdk/client-s3";
// import aws from "aws-sdk";
import multer from "multer";
import multers3 from "multer-s3";

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIA4MPBM56LNV4YAN4H",
    secretAccessKey: "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",
  },
});

const upload = (bucketName) => {
  multer({
    storage: multers3({
      s3: s3,
      bucket: bucketName,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, "image.jpeg");
      },
    }),
  });
};

export const setDP = (req, res, next) => {

  console.log(req.file);

  const uploadSingle = upload("rubidya").single("media");

  uploadSingle(req, res, (err) => {
    if (err) res.status(400).json({ sts: "00", msg: err.message });

    console.log(req.files);

    res.status(200).json({ data: req.file });
  });

  res.status(200).json({
    sts: "01",
    msg: "Image uploaded successfully",
    data: req.file,
  });
};
