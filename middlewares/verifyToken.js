import jwt from "jsonwebtoken"
import {config} from "dotenv"
config()
export const verifyToken= (...allowedRoles) => {
    return async(req,res,next)=>{
    //read token from req
    try{
    let token = req.cookies.token;
    console.log("token:",token)
    if(!token)
    {
        return res.status(401).json({message:"token is not present"})
    }
    //verify the validatiy of the toke
    const decodedToken = jwt.verify(token,process.env.JWT_SECRET)
    console.log("decodedToken:",decodedToken)
    console.log("allowedRoles:",allowedRoles)

    //check if role is allowed
    if(!allowedRoles.includes(decodedToken.role)){
        console.log("Role mismatch: ", decodedToken.role, " not in ", allowedRoles);
        return res.status(403).json({message:"forbidden. you dont have permission"})
    }
    //attach user info to req for use in routes
    req.user = decodedToken;

    //forward req to next middleware/route
    next();}
    catch(err)
    {
        //jwt verify throws if token is invalid/expired
        if(err.name === "TokenExpiredError")
        {
            return res.status(401).json({message:"session expired please login"})
        }
        if(err.name === "JsonWebTokenError")
        {
            return res.status(401).json({message:"invalid token please login"})
        }
        
        // If it's some other error, send a generic 401 or call next(err)
        // For security, a 401 is usually safer than 500 for auth issues
        console.error("Token verification error:", err);
        return res.status(401).json({message:"Authentication failed", error: err.message});
    }
}}
