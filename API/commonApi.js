import exp from "express"
import { authenticate } from "../Services/authServices.js"
import { UserTypeModel } from "../models/userModel.js";
import { hash, compare } from "bcrypt"
import { verifyToken } from "../middlewares/verifyToken.js"

export const commonRoute = exp.Router()

//login
commonRoute.post("/login", async (req, res) => {
    //get user credentials from req
    let authorCred = req.body;
    //call authenticate
    let { token, user } = await authenticate(authorCred)
    //save token as http cookie only
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false });
    //respose
    res.status(200).json({ message: "login successfully", user })
})


//logout
commonRoute.get("/logout", async (req, res) => {
    //logout for users,author and admin
    //clear the cookie named 'token'
    res.clearCookie('token', {
        httpOnly: true,    //must match orginal settings
        secure: false,    //must match original setttings
        samesite: 'lax'  //must match orginal settings
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
       payload: user
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});
