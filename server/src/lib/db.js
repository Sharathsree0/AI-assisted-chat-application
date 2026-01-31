import mongoose from "mongoose"

export const connectDB=async()=>{
    try{
         mongoose.connection.on('connected',()=>console.log("DB connected"));
        await mongoose.connect(`${process.env.MONGODB_URI}/ai_chat_app`)
    }catch(err){
        console.error(err,()=>console.log("DB connection failed"))
    }
}