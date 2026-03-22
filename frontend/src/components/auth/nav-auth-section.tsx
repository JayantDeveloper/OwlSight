import { auth } from "@/auth";
import Link from "next/link";
import { UserMenu } from "./user-menu";

export async function NavAuthSection() {
  const session = await auth();

  if (session?.user) {
    return <UserMenu session={session} />;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/signin"
        className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white/[0.06]"
        style={{ color: "var(--txt-2)" }}
      >
        Sign in
      </Link>
      <Link
        href="/auth/signup"
        className="btn-gradient rounded-full px-4 py-1.5 text-sm font-semibold text-white"
      >
        Get started
      </Link>
    </div>
  );
}
