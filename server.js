import exp from "express"
import {connect} from "mongoose"
import {config} from "dotenv"
import { userRoute } from "./API/userApi.js";
import { authorRoute } from "./API/authorApi.js";
import { adminRoute } from "./API/adminApi.js";
import cookieParser from "cookie-parser";
import { commonRoute } from "./API/commonApi.js"
import cors from "cors"

//process.env
config() 

const app = exp();

//use cors middle ware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
//add body parseer middleware
app.use(exp.json())
//cookie parser
app.use(cookieParser())



//connect API's
app.use('/user-api',userRoute)
app.use('/author-api',authorRoute)
app.use('/admin-api',adminRoute)
app.use('/common-api',commonRoute)


//connect to database
const connectdb = async()=>{
{
    try{
    console.log("Attempting database connection to DB_URL:", process.env.DB_URL);
    await connect(process.env.DB_URL)
    console.log("connected to database successfully")
    //create http server
    app.listen(process.env.PORT,()=>console.log("server listening"))}
    catch(err){
        console.log("error in connecting db server",err)
    }
}}
connectdb()


//dealing with invalid path
app.use((req,res,next)=>{
    //console.log(req.url)
    res.json({message:req.url + " " + "is invalid-path"});
})


//error handling middleware
app.use((err,req,res,next)=>{
    console.log("error found",err)
    res.json({message:"error",reason:err.message})
})

app.use((err, req, res, next) => {

  console.log("Error name:", err.name);
  console.log("Error code:", err.code);
  console.log("Full error:", err);

  // mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // mongoose cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "error occurred",
      error: err.message,
    });
  }

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];

    return res.status(409).json({
      message: "error occurred",
      error: `${field} "${value}" already exists`,
    });
  }

  // custom errors
  if (err.status) {
    return res.status(err.status).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // default server error
  res.status(500).json({
    message: "error occurred",
    error: "Server side error",
  });
});