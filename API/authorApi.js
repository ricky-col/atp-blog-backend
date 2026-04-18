import exp from "express"
import { ArticleModel } from "../models/articleModel.js"
import { register } from "../Services/authServices.js"
import { authenticate } from "../Services/authServices.js"
import { UserTypeModel } from "../models/userModel.js"
import { checkAuthor } from "../middlewares/checkauthor.js"
import { verifyToken } from "../middlewares/verifyToken.js"
import upload from "../config/multer.js"
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";
import cloudinary from "../config/cloudinary.js"

export const authorRoute = exp.Router()

//register author
authorRoute.post('/users', upload.single("profileImageUrl"), async (req, res, next) => {
    let cloudinaryResult;
    try {
        let authorObj = req.body;

        // Upload image to cloudinary if exists
        if (req.file) {
            cloudinaryResult = await uploadToCloudinary(req.file.buffer);
        }

        // call register
        const newAuthorObj = await register({ 
            ...authorObj, 
            role: "AUTHOR",
            profileImageUrl: cloudinaryResult?.secure_url
        })

        res.status(201).json({ 
            message: "author created successfully", 
            user: newAuthorObj 
        })
    } catch (err) {
        // Rollback image if registration fails
        if (cloudinaryResult?.public_id) {
            await cloudinary.uploader.destroy(cloudinaryResult.public_id);
        }
        next(err);
    }
})


//authenticate author(public) in common-api


//create article (protected route)
authorRoute.post('/articles',verifyToken("AUTHOR"),async (req, res) => {
    //get article from req
    let article = req.body;
    //check for author using checkAuthor middleWARE
    //call create article document
    let articleDoc = new ArticleModel(article)
    //save article documnet
    let createdArticleDoc = await articleDoc.save()
    //response 
    res.status(201).json({ message: "article created successfully", payload: createdArticleDoc })
})


//read all articles of author (protected)
authorRoute.get('/articles/:authorId',verifyToken("AUTHOR"),async(req,res)=>{
    //read author id
    let authorId = req.params.authorId;
   //check the author using checkAuthor middleWARE
    
    //read the articles by this author which are active
    let articles = await ArticleModel.find({author:authorId,isArticleActive:true}).populate("author","firstName email")
    //send response
    if(!articles)
    {
        res.status(404).json({message:"articles not found"})
    }
    res.status(200).json({message:"articles read successfully",payload:articles})
})
//edit article (protected)
authorRoute.put('/articles',verifyToken("AUTHOR"),async(req,res)=>{
    //get the modified article
    let modifiedArticle = req.body;
    
    // Find article to verify ownership
    let articleOfDb = await ArticleModel.findById(modifiedArticle._id);
    
    if(!articleOfDb) {
        return res.status(404).json({message:"Article not found"});
    }

    // Verify ownership
    if (articleOfDb.author.toString() !== req.user.userId) {
        return res.status(403).json({message: "Forbidden. You can only edit your own articles"});
    }

    //update the article
    let updatedArticle = await ArticleModel.findByIdAndUpdate(modifiedArticle._id,{ 
        $set:{
            title:modifiedArticle.title,
            content:modifiedArticle.content,
            category:modifiedArticle.category
        }
    },{new:true});

    //send response
    res.status(200).json({message:"Updated article successfully",payload:updatedArticle});
})


// //delete article(soft delete) (protected)
// authorRoute.patch('/article',verifyToken("AUTHOR"),async(req,res)=>{
//     //get the article
//     let deletedarticle = req.body;
//     if(req.user.role === "AUTHOR" && article.author.toString() !== req.user.userId)
//     {
//         return res.status(403).json({message:"forbidden"})
//     }
//     //already in requested state
//     if(article.isArticleActive === deletedarticle.isArticleActive)
//     {
//         return res.status(400).json({message:"article is already ${isArticleActive ? 'active' : 'inactive'}"})
//     }
//     //find the article
//     let articleofDb = await ArticleModel.findOne({_id:deletedarticle.articleId,author:deletedarticle.author})
//     if(!articleofDb)
//     {
//         res.status(404).json({message:"article not found"})
//     }
//     //delete
//     let deletedArticle = await ArticleModel.findByIdAndUpdate(deletedarticle.articleId,{
//         $set:{
//             isArticleActive:deletedarticle.isArticleActive
//         }
//     },{new:true})
//         res.status(201).json({message:"deleted article successfully",payload:deletedarticle})
// })

//delete(soft delete) article(Protected route)
authorRoute.patch("/articles/:id", verifyToken("AUTHOR"), async (req, res) => {
  const { id } = req.params;
  const { isArticleActive } = req.body;
  // Find article
  const article = await ArticleModel.findById(id); //.populate("author");
  //console.log(article)
  if (!article) {
    return res.status(404).json({ message: "Article not found" });
  }

  //console.log(req.user.userId,article.author.toString())
  // AUTHOR can only modify their own articles
  if (req.user.role === "AUTHOR" && 
    article.author.toString() !== req.user.userId) {
    return res
    .status(403)
    .json({ message: "Forbidden. You can only modify your own articles" });
  }
  // Already in requested state
  if (article.isArticleActive === isArticleActive) {
    return res.status(400).json({
      message: `Article is already ${isArticleActive ? "active" : "deleted"}`,
    });
  }

  //update status
  article.isArticleActive = isArticleActive;
  await article.save();

  //send res
  res.status(200).json({
    message: `Article ${isArticleActive ? "restored" : "deleted"} successfully`,
    article,
  });
});