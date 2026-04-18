import mongoose from "mongoose";
import { UserTypeModel } from "./models/userModel.js";
import { config } from "dotenv";
config();

async function inspectUsers() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.DB_URL);
        console.log("Connected successfully.");

        const users = await UserTypeModel.find({}, "email role firstName isActive").lean();
        console.log("\n--- USER RECORDS IN ATLAS ---");
        console.table(users);
        console.log("-----------------------------\n");

        await mongoose.connection.close();
    } catch (err) {
        console.error("Inspection failed:", err);
    }
}

inspectUsers();
