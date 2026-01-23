import express from "express";
import authmiddleware from "../middleware/authmiddleware.js";
import { getUser,updateProfile,uploadPhoto } from "../controllers/profile.js";
import upload from "../config/multer.js";

const profileRouter = express.Router();

profileRouter.get("/me",authmiddleware,getUser);
profileRouter.put("/me",authmiddleware,updateProfile);
profileRouter.post("/photo",authmiddleware,upload.single("photo"),uploadPhoto);

export default profileRouter;