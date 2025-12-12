const AWS = require("aws-sdk");
const { v4: uuid } = require("uuid");

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

const s3 = new AWS.S3();

exports.uploadToS3 = async (file) => {
  const fileKey = `questions/${uuid()}-${file.originalname}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  // Upload to S3
  const uploadResult = await s3.upload(params).promise();
  return {
    key: fileKey,               // store key in MongoDB
    location: uploadResult.Location
  };
};

/**
 * Generate signed URL for private object
 */
exports.getSignedUrl = (key, expires = 100 * 60) => { // default 100 minutes
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: expires
  })
};
