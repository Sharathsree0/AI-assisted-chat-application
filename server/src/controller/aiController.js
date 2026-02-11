import {GoogleGenerativeAI } from "@google/generative-ai";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const rephraseText = async(req,res)=>{
    try{
        const{text}=req.body;
        const model= genAi.getGenerativeModel({
            model:"gemini-2.5-flash",
            systemInstruction:"You are a professional writer. Rewrite the user’s sentence to be clearer, more natural, and more engaging while preserving the original meaning. Improve the structure and wording, correct all spelling and grammatical errors, and return **only** the rephrased sentence." })
        const responding = await model.generateContent(text)
        const result = responding.response.text();
        res.json({success:true,result})
    }catch(error){
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

export const summarizesText = async(req,res)=>{
    try{
        const{text}=req.body;
        const model= genAi.getGenerativeModel({
            model:"gemini-2.5-flash",
            systemInstruction:"Act as a professional writer. Rewrite the text to be short and snappy, but keep the specific milestones and the high energy. Don't make it sound like a robot; keep the 'human' excitement. Return ONLY the rephrased sentence." })
        const responding = await model.generateContent(text)
        const result = responding.response.text();
        res.json({success:true,result})
    }catch(error){
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}