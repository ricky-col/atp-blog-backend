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
export const authenticate = async ({ email, password }) => {
    console.log("Authenticating user with email:", email);
    
    //check user with email (case-insensitive search is safer)
    const user = await UserTypeModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    if (!user) {
        console.log("Auth failed: User not found with email:", email);
        const err = new Error("User not found with this email");
        err.status = 401;
        throw err;
    }

    console.log("User found in DB. Stored hash exists:", !!user.password);
    
    //comparing the password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Bcrypt compare result:", isMatch);
    
    if (!isMatch) {
        console.log("Auth failed: Incorrect password for user:", email);
        const err = new Error("invalid password");
        err.status = 401;
        throw err;
    }

    //check if user is active
    if (!user.isActive) {
        console.log("Auth failed: Account blocked for user:", email);
        const err = new Error("your account is blocked, so please contact the admin");
        err.status = 401;
        throw err;
    }

    //generating jwt token
    const token = jwt.sign(
        { userId: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const userObj = user.toObject();
    delete userObj.password;
    console.log("Auth successful for user:", email);
    return { token, user: userObj };
};



