/**
 * POST /api/assistant/attach-receipt
 * Attaches an uploaded receipt directly to the user's active ExpenseDraft in MongoDB.
 * This bypasses Gemini — the image data is reliably stored server-side.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadReceiptImage } from "@/lib/cloudinary";
import connectDB from "@/lib/db";
import ExpenseDraft from "@/models/ExpenseDraft";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("receipt") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No valid image provided" }, { status: 400 });
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await uploadReceiptImage(buffer, file.name);

    const receipt = {
      publicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    };

    // Attach to active draft
    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    const draft = await ExpenseDraft.findOne({
      userId: userObjectId,
      status: { $in: ["collecting", "awaiting-confirmation"] },
    }).sort({ createdAt: -1 });

    if (draft) {
      draft.receipts = [...(draft.receipts || []), receipt];
      await draft.save();
    }

    return NextResponse.json({
      success: true,
      receipt,
      attachedToDraft: !!draft,
    });
  } catch (error: any) {
    console.error("Attach receipt error:", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
