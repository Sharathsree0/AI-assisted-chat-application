import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protectedRoute = async (req, res, next) => {
  try {
   
    const token = req.cookies.jwt
    if(!token){
      return res.json({success:false, message:"Unauthorized-Token not provided"})
    }
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
