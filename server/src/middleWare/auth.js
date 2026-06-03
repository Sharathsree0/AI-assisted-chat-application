import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protectedRoute = async (req, res, next) => {
  try {
    //  Check headers for the Bearer token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({ success: false, message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};