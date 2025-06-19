const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

exports.registerUser = async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    const { name, email, password, referralCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already exists:", email);
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const newReferralCode = uuidv4();

    let parentId = null;
    if (referralCode) {
      console.log("Processing referral code:", referralCode);
      const parentUser = await User.findOne({ referralCode });
      if (!parentUser || !parentUser.isActive) {
        console.log("Invalid or inactive referral code:", referralCode);
        return res
          .status(400)
          .json({ message: "Invalid or inactive referral code" });
      }
      if (parentUser.referrals.length >= 8) {
        console.log(
          "Parent user has reached maximum referrals:",
          parentUser.userId
        );
        return res
          .status(400)
          .json({ message: "Parent user has reached maximum referrals" });
      }
      parentId = parentUser.userId;
      parentUser.referrals.push(userId);
      await parentUser.save();
      console.log("Parent user updated with new referral:", parentUser.userId);
    }

    const newUser = new User({
      userId,
      name,
      email,
      password: hashedPassword,
      referralCode: newReferralCode,
      parentId,
      referrals: [],
    });

    await newUser.save();
    console.log("New user created successfully:", userId);

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      userId,
      name,
      email,
      referralCode: newReferralCode,
      parentId,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ userId: user.userId, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
