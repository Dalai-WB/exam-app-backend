const { uploadToS3 } = require('../services/s3.service');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await uploadToS3(req.file);

    // Send JSON response to client
    res.json(result); // <--- must send the object
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
};
