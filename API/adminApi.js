import exp from "express"
import { UserTypeModel } from "../models/userModel.js";
export const adminRoute=exp.Router()


//read all articles (optional)
//block users
// unblock user
adminRoute.put('/block/:userid',async(req,res)=>{
    //read the user data which u want to block
    let userId = req.params.userid;
    //read the document of the user from the database
    let userdbb = await UserTypeModel.findById(userId);
    //block the user 
    if(!userdbb)
    {
        res.status(401).json({message:"user not found"})
    }
    let userisactive = userdbb.isActive
    if(userisactive)
    {
    let updateduser = await UserTypeModel.findByIdAndUpdate(userId,{
        $set:{
            isActive:"false"
        }

    },{new:true})
    //read the resposne
    res.status(200).json({message:"user blocked successfully",updateduser})}
    res.status(200).json({message:"user is already blocked"})
})

// unblock user
adminRoute.put('/unblock/:userId',async(req,res)=>{
    //read the user data which u want to unblock
    let userId = req.params.userId;
    //read the document from database
    let userDoc = await UserTypeModel.findById(userId)
    if(!userDoc){
                res.status(401).json({message:"user not found"})

    }
    let userisactive = userDoc.isActive
    if(!userisactive)
    {
    let updateduser = await UserTypeModel.findByIdAndUpdate(userId,{
        $set:{
            isActive : "true"
        }
    },{new:true})
    //response
    res.status(200).json({message:"user unblocked successsfully",updateduser})}
    res.status(200).json({message:"user is not blocked"})
})
