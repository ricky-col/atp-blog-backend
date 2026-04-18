import { connect } from "mongoose";
const DB_URL = "mongodb://127.0.0.1:27017/anurag-blog-db";
console.log("Connecting to", DB_URL);
connect(DB_URL).then(() => {
    console.log("Success");
    process.exit(0);
}).catch(err => {
    console.error("Error", err);
    process.exit(1);
});
