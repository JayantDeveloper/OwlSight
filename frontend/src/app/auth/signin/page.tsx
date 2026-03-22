import { SignInForm } from "@/components/auth/sign-in-form";
import Link from "next/link";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: "var(--canvas)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-glow-violet-sm">
            <Image src="/owlsightlogo.jpg" alt="OwlSight" fill sizes="48px" className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold" style={{ color: "var(--txt-1)" }}>Welcome back</h1>
            <p className="text-sm" style={{ color: "var(--txt-3)" }}>Sign in to your OwlSight account</p>
          </div>
        </div>

        <SignInForm />

        <p className="mt-6 text-center text-sm" style={{ color: "var(--txt-3)" }}>
          No account?{" "}
          <Link href="/auth/signup" className="font-medium text-solviolet hover:text-solviolet/80">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
