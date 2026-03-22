import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/profile-form";
import { db } from "@/lib/db";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!user) redirect("/auth/signin");

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <h2 className="mb-6 text-base font-semibold" style={{ color: "var(--txt-1)" }}>Profile</h2>
      <ProfileForm user={user} />
    </div>
  );
}
