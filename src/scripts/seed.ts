import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Direct MongoDB connection for seeding (outside Next.js context)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  console.log("Usage: MONGODB_URI=mongodb://... npx tsx src/scripts/seed.ts");
  process.exit(1);
}

// Define User schema inline to avoid Next.js module resolution issues
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected to MongoDB\n");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@sachann.com" });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log("\n   Skipping creation. If you need to reset, delete the user first.");
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("Admin@123", salt);

      const admin = await User.create({
        email: "admin@sachann.com",
        name: "Sachann Admin",
        password: hashedPassword,
      });

      console.log("✅ Admin user created:");
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Password: Admin@123`);
      console.log("\n⚠️  Please change the password after first login!");
    }

    console.log("\n✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
