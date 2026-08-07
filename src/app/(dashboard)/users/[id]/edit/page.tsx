import { notFound } from "next/navigation";
import { UserForm } from "@/components/users/UserForm";
import { getUserById } from "@/actions/user";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 space-y-4">
        <Link
          href="/users"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Users
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit User</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update user details and role
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 lg:p-6 shadow-sm">
        <UserForm user={user} />
      </div>
    </div>
  );
}
