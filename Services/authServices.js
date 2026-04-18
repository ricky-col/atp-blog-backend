import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import {UserTypeModel} from "../models/userModel.js"
import {config} from "dotenv"
config();

//register function
export const register = async (userObj) => {
    console.log("Registering new user with email:", userObj.email, "and role:", userObj.role);
    
    //create document
    const userDoc = new UserTypeModel(userObj);
    
    //validate
    await userDoc.validate();
    
    if (!userObj.password) {
        console.error("Registration error: Password is missing in userObj!");
        throw new Error("Password is required for registration");
    }

    //hash and replace plain password
    console.log("Hashing password for email:", userObj.email);
    userDoc.password = await bcrypt.hash(userObj.password, 10);
    
    //save user
    const created = await userDoc.save();
    console.log("User successfully saved to DB with role:", created.role);
    
    //convert document to object to remove password
    const newUserObj = created.toObject();
    delete newUserObj.password;
    
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



