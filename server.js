const { render } = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");


require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set; tokens will be invalidated when the server restarts.");
}

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mybase")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.set("view engine", "ejs"); // default location is 'views' folder
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const userFormat = new mongoose.Schema({
  username: String,
  email: { type: String, required: true, unique: true },
  age: Number,
  password: String,
});

const User = mongoose.model("User", userFormat);

app.get("/", (req, res) => {
  res.render("index");
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, try later",
});

app.use("/api/", apiLimiter);

app.get("/dashboard", (req, res) => {
  res.render("result");
});
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
app.get("/api/profile", auth_middleware, async(req, res) => {
  const user = await User.findById(req.userId).select("-password");
  res.json({success: true, user});
});
app.post("/api/users", async (req, res) => {
  const { username, email, age, password } = req.body;

  if (!username || !email || !age || !password) {
    // return res.send("All fields are required!");
    return res.status(400).json({
      success: false,
      message: "Invalid data! All fields are required.",
    });
  }
  const existing_user = await User.findOne({email});
  if(existing_user){
    return res.status(409).json({
      success: false,
      message: "Email already registered! Please Login.",
    });
  }
  const hashed_pass = await bcrypt.hash(password, 10); // here 10 is salt rounds, means how many times hashing is applied
  const newUser = new User({ username, email, age, password: hashed_pass });
  await newUser.save();

  // Generate token for new user
  const token = jwt.sign({
    userId: newUser._id},
  jwtSecret,
  {expiresIn: "1h"});

  res.json({
    success: true,
    message: "Registered successfully!",
    token
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const loggedUser = await User.findOne({ email });
  if (!loggedUser) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed! User not found.",
    });
  }

  const isMatch = await bcrypt.compare(password, loggedUser.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed! Incorrect password.",
    });
  }

  const token = jwt.sign({
    userId: loggedUser._id},
  jwtSecret,
  {expiresIn: "1h"}); // token valid for 1 hour

  res.json({ message: "Login successful", success: true, token  });
  
});

app.get("/api/weather", async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).json({ error: "City name is required" });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    const data = await response.json();

    if (data.cod !== 200) {
      return res.json({ error: data.message || "City not found" });
    }

    res.json({
      city: data.name,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1),
    });
  } catch (err) {
    console.error('Weather API error:', err);
    res.json({ error: "Failed to fetch weather data" });
  }
});

function auth_middleware(req, res, next){
  const auth_header = req.headers.authorization;
  if(!auth_header){
    return res.status(401).json({success: false, message: "No token provided"});
  }
  const token = auth_header.split(" ")[1]; // Bearer <token>
  try{
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  }catch(err){
    return res.status(401).json({success: false, message: "Invalid token"});
  }
}

app.listen(3000, () => {
  console.log("Server is running on port 3000...");
});
