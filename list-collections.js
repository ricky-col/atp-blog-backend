import mongoose from "mongoose";
import { config } from "dotenv";
config();

async function listCollections() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.DB_URL);
        console.log("Connected successfully.");

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("\n--- COLLECTIONS IN DB ---");
        collections.forEach(c => console.log("-", c.name));
        console.log("--------------------------\n");

        for (let coll of collections) {
            const count = await mongoose.connection.db.collection(coll.name).countDocuments();
            console.log(`Collection [${coll.name}] count: ${count}`);
            if (count > 0) {
                const sample = await mongoose.connection.db.collection(coll.name).findOne();
                console.log("Sample document:", JSON.stringify(sample, null, 2));
            }
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error("Collection listing failed:", err);
    }
}

listCollections();
