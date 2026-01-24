const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const app = express();
const PORT = process.env.PORT || 3000;
const db = require('./config/db');
const admin = require("firebase-admin");
require('dotenv').config(); // Add this at the top of server.js


const serviceAccountBase64 = process.env.FIREBASE_ADMIN_KEY_BASE64;
if (!serviceAccountBase64) {
  throw new Error("Missing FIREBASE_ADMIN_KEY_BASE64 environment variable");
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Enable CORS for requests from localhost:4200
app.use(cors({
  origin: ['http://localhost:4200', 'https://exam-app-seven-omega.vercel.app']
}));
// Middlewares
app.use(bodyParser.json());

// Routes
const routes = require('./app/routes');
app.use('/', routes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
