import mongoose from "mongoose";
import Expense from "./src/models/Expense.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const expense = new Expense({
      title: "Test Entry",
      amount: 100,
      category: "Miscellaneous",
      paidBy: "Anuj",
      date: new Date(),
      metadata: { idempotencyKey: "test-key-" + Date.now() },
      isArchived: false,
    });
    await expense.validate();
    console.log("Validation passed");
  } catch (e) {
    console.error("Validation error:", e);
  }
  process.exit(0);
}
run();
