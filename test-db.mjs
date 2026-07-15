import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  try {
    console.log("Connecting to DB:", MONGODB_URI.split("@")[1]); // print the host part to avoid leaking password
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connection successful!");
    
    // Also try to query the User collection to see if it exists
    const users = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`✅ Found ${users} users in the database.`);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
}

testConnection();
