import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

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
    role: { type: String, required: true, enum: ["admin", "admin_manager", "manager", "employee"], default: "employee" },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected to MongoDB\n");

    // --- Super Admin (primary account) ---
    const adminManagerEmail = "anujsachan98@gmail.com";
    const existingAdminManager = await User.findOne({ email: adminManagerEmail });

    if (existingAdminManager) {
      // Update role if it's missing or outdated
      if (existingAdminManager.role !== "admin_manager") {
        existingAdminManager.role = "admin_manager";
        await existingAdminManager.save();
        console.log(`✅ Updated existing user to admin_manager (Super Admin) role: ${adminManagerEmail}`);
      } else {
        console.log(`⚠️  Super Admin user already exists: ${adminManagerEmail} (role: ${existingAdminManager.role})`);
      }
    } else {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash("Anuj@123", salt);

      await User.create({
        email: adminManagerEmail,
        name: "Anuj Sachan",
        password: hashedPassword,
        role: "admin_manager",
        isActive: true,
        mustChangePassword: true,
      });

      console.log("✅ Super Admin user created:");
      console.log(`   Email: ${adminManagerEmail}`);
      console.log(`   Password: Anuj@123`);
      console.log(`   Role: Super Admin`);
      console.log("\n⚠️  Please change the password after first login!");
    }

    // --- Migrate existing old admin user if exists ---
    const oldAdmin = await User.findOne({ email: "admin@sachann.com" });
    if (oldAdmin && !oldAdmin.role) {
      oldAdmin.role = "admin";
      await oldAdmin.save();
      console.log("\n✅ Migrated old admin@sachann.com user → role: admin");
    }

    // --- Migrate any other users without a role ---
    const usersWithoutRole = await User.find({ role: { $exists: false } });
    if (usersWithoutRole.length > 0) {
      for (const user of usersWithoutRole) {
        user.role = "admin"; // Default existing users to admin
        await user.save();
      }
      console.log(`\n✅ Migrated ${usersWithoutRole.length} existing users → role: admin`);
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
