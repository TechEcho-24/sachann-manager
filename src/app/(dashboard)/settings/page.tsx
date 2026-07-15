"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/actions/auth";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await changePasswordAction(formData);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success("Password changed successfully");
      (e.target as HTMLFormElement).reset();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account preferences
        </p>
      </div>

      {/* Change Password */}
      <div className="bg-card rounded-2xl border border-border p-5 lg:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <Lock className="w-[18px] h-[18px] text-brand-green" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Change Password
            </h2>
            <p className="text-xs text-muted-foreground">
              Update your account password
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                required
                className="h-11 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNew ? "text" : "password"}
                required
                minLength={6}
                className="h-11 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="h-11 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 rounded-xl bg-brand-green hover:bg-brand-green-light text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </form>
      </div>

      {/* App Info */}
      <div className="bg-card rounded-2xl border border-border p-5 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-cover" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Sachann Manager
            </h2>
            <p className="text-xs text-muted-foreground">
              Expense Management System
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Version 1.0.0</p>
          <p>Built for Sachann — Premium Natural Food Brand</p>
        </div>
      </div>
    </div>
  );
}
