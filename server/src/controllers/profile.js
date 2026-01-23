import User from "../models/user.js";

export const getUser= async(req,res)=>{
    res.json(req.user)
}

export const updateProfile= async (req,res)=>{
    const {name,status}=req.body;
const user = await User.findById(req.user._id);

if(name)user.name=name;
if(status)user.status=status;
await user.save();

res.json({message:"Profile updated",user})
}

export const uploadPhoto = async (req, res) => {
  const user = await User.findById(req.user._id);

  user.photo = req.file.path;
  await user.save();

  res.json({
    message: "Profile photo updated",
    photo: user.photo
  });
};
