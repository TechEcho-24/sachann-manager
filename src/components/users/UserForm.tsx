"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USER_ROLES, ROLE_LABELS, type UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { createUser, updateUser, type SerializedUser } from "@/actions/user";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface UserFormProps {
  user?: SerializedUser;
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const isEditing = !!user;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || "employee");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("role", selectedRole);

    if (!isEditing) {
      formData.set("isActive", "true");
    }

    try {
      const result = isEditing
        ? await updateUser(user._id, formData)
        : await createUser(formData);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success(
        isEditing ? "User updated successfully" : "User created successfully"
      );
      router.push("/users");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Full Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={user?.name}
          placeholder="Enter full name"
          required
          className="h-11 rounded-xl"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address <span className="text-red-400">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user?.email}
          placeholder="Enter email address"
          required
          className="h-11 rounded-xl"
        />
      </div>

      {/* Password (only for create) */}
      {!isEditing && (
        <>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, uppercase, lowercase, number, special"
                required
                minLength={8}
                className="h-11 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter password"
                required
                minLength={8}
                className="h-11 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Role */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Role <span className="text-red-400">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {USER_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-medium border transition-all duration-150 text-left",
                selectedRole === role
                  ? "border-brand-green bg-brand-green/10 text-brand-green shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-brand-green/40 hover:text-foreground"
              )}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 px-8 rounded-xl bg-brand-green hover:bg-brand-green-light text-white font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Update User"
          ) : (
            "Create User"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-11 rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
