"use server";

import { uploadReceiptImage } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";

export async function uploadChatReceiptAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("receipt") as File | null;
  if (!file || file.size === 0) {
    return { error: "No valid image provided" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await uploadReceiptImage(buffer, file.name);

    return {
      success: true,
      receipt: {
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      },
    };
  } catch (error) {
    console.error("Failed to upload chat receipt:", error);
    return { error: "Failed to upload image. Please try again." };
  }
}
