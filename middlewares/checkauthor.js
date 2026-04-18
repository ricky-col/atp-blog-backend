import {UserTypeModel} from "../models/userModel.js"
export const checkAuthor = async(req,res,next)=>{
    //get author id from req
    let authorId =  req.body?.author || req.params?.authorId
    //verify author
    let author = await UserTypeModel.findById(authorId);
        if(!author)
        {
            res.status(401).json({ message: "invalid author" })
        }
       // if user found but the role is not author
        if(author.role!=="AUTHOR"){
            return res.status(403).json({message:"user is not an author"})
        }
        //if author is blocked
        if(!author.isActive)
        {
            return res.status(403).json({message:"author account is not active"})
        }
    //forward req to next
    next()
}
