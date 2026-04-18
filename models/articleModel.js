import { Schema,model } from  'mongoose'

//create user comment schema
const commentSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'user'
    },
    comment:{
        type:String
    }
})

//create article schema
const articleSchema = new Schema({
    author:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:[true,"author id is required"]
    },
    // articleId:{
    //     type:String,
    //     required:true
    // },
    title:{
        type:String,
        required:[true,"Title is required"]
    },
    category:{
        type:String,
        required:[true,"category is required"]
    },
    content:{
        type:String,
        required:[true,"content is required"]
    },
    comments:{
        type:[commentSchema]
    },
    isArticleActive:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true,
    strict:"throw",
    versionKey:false
})

//create model
export const ArticleModel = model('article',articleSchema)