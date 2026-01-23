import express from "express";
import User from "../models/user.js";
import authmiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/", authmiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("_id name email status");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "failed to fetch users" });
  }
});

export default router;
