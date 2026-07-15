import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://sachannofficial_db_user:o52I8FPLbiWnEMMe@cluster0.tcuxweg.mongodb.net/sachann-manager?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connection successful!");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

testConnection();
