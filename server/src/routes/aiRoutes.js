import express from "express";
import { rephraseText, summarizesText,  } from "../controller/aiController.js";

const aiRouter= express.Router();

aiRouter.post("/rephrase",rephraseText);
aiRouter.post("/summarizes",summarizesText)
aiRouter.post("/tone", changeTone);
aiRouter.post("/soften", softenText);
aiRouter.post("/smart-reply", smartReply);

export default aiRouter;
