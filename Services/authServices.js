import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import {UserTypeModel} from "../models/userModel.js"
import {config} from "dotenv"
config();

//register function
export const register = async (userObj) =>{
    //create documnet
    const userDoc = new UserTypeModel(userObj);
    //validate for empty passwords
    await userDoc.validate();
    //hash and replace plain password
    userDoc.password = await bcrypt.hash(userDoc.password, 10);
    //save user
    const created = await userDoc.save();
    //convert documnet to object to remove password.    toObject is used to convert the mongo documnet into jsobject
    const newUserObj = created.toObject();
    //remove password
    delete newUserObj.password;
    //return user obj without password
    return newUserObj;
}
//authentication function
export const authenticate = async ({ email,password,isActive}) => {
    //check user with email 
    const user = await UserTypeModel.findOne({ email })
    if(!user)
    {
        const err = new Error("invalid password")
        err.status = 401
        throw err
    }
    
    //comparing the password
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch)
    {
        const err = new Error("invalid password")
        err.status = 401;
        throw err
    }

     //if user valid but blocked by admin
    const active = await UserTypeModel.findOne({ isActive})
    if(!user.isActive)
    {
        const err = new Error("your account is blocked,so please contact the admin")
        err.status = 401
        throw err

    }
    //generating jwt token
    const token = jwt.sign({userId:user._id,
        role:user.role,email:user.email},
        process.env.JWT_SECRET,{expiresIn:"1h"}
    );
    const userObj = user.toObject();
    delete userObj.password;
    return { token,user : userObj};
};



