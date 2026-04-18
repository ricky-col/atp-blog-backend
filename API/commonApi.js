import exp from "express"
import { authenticate } from "../Services/authServices.js"
import { UserTypeModel } from "../models/userModel.js";
import { hash, compare } from "bcrypt"
import { verifyToken } from "../middlewares/verifyToken.js"
import mongoose from "mongoose";

export const commonRoute = exp.Router()

//login
commonRoute.post("/login", async (req, res) => {
    console.log("POST /common-api/login hit with body:", { ...req.body, password: "REDACTED" });
    //get user credentials from req
    let authorCred = req.body;
    //call authenticate
    let { token, user } = await authenticate(authorCred)
    //save token as http cookie only
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, { 
        httpOnly: true, 
        sameSite: isProduction ? "none" : "lax", 
        secure: isProduction 
    });
    //respose
    res.status(200).json({ 
        message: "login successfully", 
        user, 
        database: mongoose.connection.name 
    })
})


//logout
commonRoute.get("/logout", async (req, res) => {
    //logout for users,author and admin
    //clear the cookie named 'token'
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    });
    res.status(200).json({ message: "logged out successfully" })
});



//change password
commonRoute.put('/change-password/:userid', async (req, res) => {

    //get current password and new password
    // console.log(req.body);

    let oldp = req.body.password;
    let newp = req.body.newpassword;
    let userId = req.params.userid;
    let userDoc = await UserTypeModel.findById(userId)
    if (!userDoc) {
        return res.status(401).json({ message: "user is not found" })
    }
    if (!userDoc.isActive) {
        return res.status(401).json({ message: "user is not active" })
    }
    //check the current password is correct
    let compared = await compare(oldp, userDoc.password)
    if (!compared) {
        return res.status(401).json({ message: "password is wrong" })
    }
    //replace current password with new password
    let newpass = await hash(newp, 10)
    let updatedpass = await UserTypeModel.findByIdAndUpdate(userId, {
        $set: {
            password: newpass
        }
    }, { new: true })
    //send response
    res.status(201).json({ message: "password is changed" });
})


//Check auth (restore session)
commonRoute.get("/check-auth", verifyToken("USER","AUTHOR","ADMIN"), async (req, res) => {
  try {
    const user = await UserTypeModel.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.status(200).json({
       message:"authenticated",
       payload: user,
       database: mongoose.connection.name
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});
