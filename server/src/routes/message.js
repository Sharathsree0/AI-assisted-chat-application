import express from "express";
import {  deleteMessage, editMessage, markAsRead, reactToMessage } from "../controllers/message.js";
import authmiddleware from "../middleware/authmiddleware.js";

const messageRouter = express.Router();

messageRouter.put("/read/:userId", authmiddleware, markAsRead);
messageRouter.put("/edit/:messageId",authmiddleware,editMessage)
messageRouter.put("/delete/:messageId",authmiddleware,deleteMessage)
messageRouter.post("/react/:messageId",authmiddleware,reactToMessage)

export default messageRouter;