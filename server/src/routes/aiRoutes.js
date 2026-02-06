import express from "express";
import { rephraseText, summarizesText,  } from "../controller/aiController.js";

const aiRouter= express.Router();

aiRouter.post("/rephrase",rephraseText);
aiRouter.post("/summarizes",summarizesText)

export default aiRouter;