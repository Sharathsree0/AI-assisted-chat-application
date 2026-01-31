import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"

//sign up 
export const signup=async(req,res)=>{
    const {fullName,email,password,bio}=req.body;
try{

    if(!fullName || !email || !password || !bio){
        return res.json({success:false,message:"Details missing"})
    }
    const existingUser= await User.findOne({email})
    if(existingUser){
        return res.json({success:false,message:"User already exists"})
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)
    const newUser= await User.create({
        fullName,email,password:hashedPassword, bio
    })
    const token= generateToken(newUser._id)
    res.json({success:true,userdate:newUser,token,message:"Account created successfully"})
}catch(error){
    console.log(error.message)
    res.json({success:false,message:error.message})

}};

//login

export const login =async(req,res)=>{
    try{
        const {email,password}=req.body;
        const userData= await User.findOne({email})
        const isPasswordCorrect= await bcrypt.compare(password,userData.password)

        if(!isPasswordCorrect){
            res.json({success:false,message:"Invalid credentials"})
        }
        const token= generateToken(userData._id)
            res.json({success:true,userdate:userData,token,message:"Login successfully"})
    }catch(error){
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

//checking user auth

export const checkingAuth= (req,res)=>{
    res.json({success:true,user:req.user});    
}
//profile update 

export const updateProfile=async(req,res)=>{
    try{
        const {fullName,bio,profilePic}=req.body;
        const userId=req.user._id;
        let updatedUser;

        if (!profilePic){
            updatedUser= await User.findByIdAndUpdate(userId,{bio,fullName},{new:true})
        }else{
            const upload= await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName},{new:true})
        }
        res.json({success:true,user:updatedUser})
    }catch(error){
        console.log(error.message)
        res.json({success:false,message:error.message})

    }
}


