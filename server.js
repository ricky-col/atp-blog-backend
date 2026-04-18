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
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace(/\/$/, "") // Add version without trailing slash
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS blocked for origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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


// Comprehensive error handling middleware
app.use((err, req, res, next) => {
  console.log("Error details:", {
    name: err.name,
    message: err.message,
    status: err.status,
    code: err.code
  });

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "error occurred",
      reason: err.message,
    });
  }

  // Mongoose cast error (invalid IDs)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "error occurred",
      reason: "Invalid ID format",
    });
  }

  // Handle duplicate key errors (code 11000)
  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  if (errCode === 11000) {
    const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : "field";
    const value = keyValue ? keyValue[field] : "unknown";

    return res.status(409).json({
      message: "error occurred",
      reason: `${field} "${value}" already exists`,
    });
  }

  // Custom errors with status
  if (err.status) {
    return res.status(err.status).json({
      message: "error",
      reason: err.message,
    });
  }

  // Default server error
  res.status(500).json({
    message: "error occurred",
    reason: "Internal Server Error",
    details: err.message
  });
});