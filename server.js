require("dotenv").config(); // Load .env variables at the very top

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// Models
const UserModel = require("./models/User");
const Pet = require("./models/Pet");
const Meeting = require("./models/Meeting");

const app = express();
app.use(express.json());
app.use(cookieParser());

// ------------------------------
// Environment Variables
// ------------------------------
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// ------------------------------
// CORS
// ------------------------------
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// ------------------------------
// MongoDB Connection
// ------------------------------
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
console.log("Connecting to:", MONGODB_URI.replace(/\/\/.*:/, '//*****:'));

// ------------------------------
// Auth Middleware
// ------------------------------
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ success: false, message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: "Invalid token" });
    req.user = decoded; // { email }
    next();
  });
}

// ------------------------------
// REGISTER
// ------------------------------
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const exists = await UserModel.findOne({ email });
  if (exists) return res.json({ success: false, message: "User exists. Please login." });

  const hash = await bcrypt.hash(password, 10);

  try {
    const user = await UserModel.create({ username, email, password: hash });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
});

// ------------------------------
// LOGIN
// ------------------------------
app.post("/login", async (req, res) => {
  const { username, email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user)
    return res.json({ success: false, message: "User does not exist. Please sign up." });

  if (user.username !== username)
    return res.json({ success: false, message: "Username is incorrect." });

  bcrypt.compare(password, user.password, (err, result) => {
    if (!result) return res.json({ success: false, message: "Password is incorrect." });

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax" });

    const refreshToken = jwt.sign({ email: user.email }, REFRESH_SECRET, { expiresIn: "7d" });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return res.json({ success: true, message: "Login successful" });
  });
});

// ------------------------------
// VERIFY TOKEN
// ------------------------------
app.get("/verify-token", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ valid: false });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.json({ valid: false });
    return res.json({ valid: true, email: decoded.email });
  });
});

// ------------------------------
// REFRESH TOKEN
// ------------------------------
app.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.json({ success: false, message: "No refresh token" });

  jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
    if (err) return res.json({ success: false, message: "Invalid refresh token" });

    const newToken = jwt.sign({ email: decoded.email }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", newToken, { httpOnly: true, secure: false, sameSite: "lax" });

    res.json({ success: true });
  });
});

// ------------------------------
// GET CURRENT USER
// ------------------------------
app.get("/user/me", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.user.email }).select("username email");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, username: user.username, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ------------------------------
// GET PETS
// ------------------------------
app.get("/pets", async (req, res) => {
  const pets = await Pet.find();
  res.json(pets);
});

// ------------------------------
// MEETINGS
// ------------------------------
app.post("/meetings", async (req, res) => {
  try {
    let { fullName, email, phone, meetingDate, meetingTime, petName, petBreed, petImage, meetingType, petType, isVaccinated } = req.body;

    petType = petType?.toLowerCase();

    if (!["adoption", "release"].includes(meetingType))
      return res.status(400).json({ success: false, message: "Invalid meeting type" });

    if (!["cat", "dog"].includes(petType))
      return res.status(400).json({ success: false, message: "Invalid pet type" });

    const selectedDate = new Date(meetingDate + "T" + meetingTime);
    const hour = selectedDate.getHours();

    if (selectedDate < new Date())
      return res.status(400).json({ success: false, message: "Meeting date cannot be in the past." });

    if (hour < 9 || hour >= 17)
      return res.status(400).json({ success: false, message: "Meeting time must be between 9am to 5pm." });

    if (meetingType === "release") {
      isVaccinated = isVaccinated === true || isVaccinated === "true";
    } else {
      isVaccinated = undefined;
    }

    const meeting = await Meeting.create({
      fullName, email, phone, meetingDate, meetingTime, petName, petBreed, petImage, meetingType, petType, isVaccinated
    });

    return res.status(201).json({ success: true, message: "Meeting submitted successfully", meeting });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
});

// ------------------------------
// GET USER MEETINGS
// ------------------------------
app.get("/meetings/user", authMiddleware, async (req, res) => {
  try {
    const meetings = await Meeting.find({ email: req.user.email }).sort({
      petName: 1,
      petBreed: 1,
      petType: 1,
      meetingType: 1,
      meetingDate: 1,
      meetingTime: 1,
      petImage: 1
    });
    return res.json({ success: true, meetings });
  } catch (err) {
    console.error("Meeting fetch error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ------------------------------
// Start Server
// ------------------------------
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// module.exports = app; // For Supertest
