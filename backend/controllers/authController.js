import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DOMAIN = "@iiitg.ac.in";
const ALLOWED_ROLES = ["student", "manager", "warden"];

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  try {
    const body = req.body;

    if (!body.email || !body.password || !body.role) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    // if (body.role === "warden") {
    //   return res.status(403).json({ msg: "Warden cannot self register" });
    // }

    const email = body.email.toLowerCase().trim();

    // Institute domain check
    if (!email.endsWith(DOMAIN)) {
      return res.status(400).json({ msg: "Use institute email" });
    }

    // Role validation
    if (!ALLOWED_ROLES.includes(body.role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    // Student hole obossoi roll number dite hobe
    if (body.role === "student" && !body.roll_number) {
      return res
        .status(400)
        .json({ msg: "Roll number is required for students" });
    }

    if (body.password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    // Existing user check
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Checking if roll number is already registered (only for students)
    if (body.role === "student") {
      const rollExists = await User.findOne({ roll_number: body.roll_number });
      if (rollExists) {
        return res.status(400).json({ msg: "Roll number already registered" });
      }
    }

    // Password hash
    const hash = await bcrypt.hash(body.password, 10);

    // Create user
    const user = await User.create({
      name: body.name,
      email,
      password: hash,
      role: body.role,
      roll_number: body.role === "student" ? body.roll_number : undefined,
      department: body.department,
      year: body.year,
      room_number: body.room_number,
      phone: body.phone,
    });

    res.status(201).json({ msg: "Signup success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Missing credentials" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      role: user.role,
      userId: user._id,
      profile: {
        name: user.name,
        email: user.email,
        roll_number: user.roll_number || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
