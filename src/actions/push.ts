"use server";

import webpush from "web-push";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth-guard";

// Set VAPID details
const contactEmail = "mailto:support@sachann.com";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(contactEmail, vapidPublicKey, vapidPrivateKey);
}

export async function saveSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Not authenticated" };

  try {
    await connectDB();

    const user = await User.findById(currentUser.userId);
    if (!user) return { error: "User not found" };

    // Initialize array if undefined
    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Check if subscription endpoint already exists
    const exists = user.pushSubscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to save push subscription:", err);
    return { error: "Failed to save push subscription" };
  }
}

export async function removeSubscription(endpoint: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Not authenticated" };

  try {
    await connectDB();

    await User.findByIdAndUpdate(currentUser.userId, {
      $pull: { pushSubscriptions: { endpoint } },
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to remove push subscription:", err);
    return { error: "Failed to remove push subscription" };
  }
}

/**
 * Sends a real-time web push notification to a user's registered devices
 */
export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  try {
    await connectDB();

    const user = await User.findById(userId).select("pushSubscriptions").lean();
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return { success: false, reason: "No subscriptions found" };
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/dashboard",
    });

    const sendPromises = user.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payloadString
        );
      } catch (err: any) {
        // If subscription is expired or invalid (410 Gone / 404 Not Found), remove it from DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Push subscription expired (${err.statusCode}). Cleaning up...`);
          await User.findByIdAndUpdate(userId, {
            $pull: { pushSubscriptions: { endpoint: sub.endpoint } },
          });
        } else {
          console.error("Push notification delivery error:", err);
        }
      }
    });

    await Promise.all(sendPromises);
    return { success: true };
  } catch (err) {
    console.error("Failed to send push notifications:", err);
    return { error: "Failed to send push notifications" };
  }
}
