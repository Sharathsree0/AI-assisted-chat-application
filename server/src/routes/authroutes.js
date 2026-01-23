import express, { Router } from "express";
import { loginUser, registerUser } from "../controllers/authcontroller.js";
import authmiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/me", authmiddleware, (req, res) => {
  res.json(req.user);
});
router.post("/register",registerUser);
router.post("/login",loginUser)

export default router;