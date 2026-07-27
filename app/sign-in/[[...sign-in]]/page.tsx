import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col min-h-screen bg-page items-center justify-center px-4 gap-6">
      <Link href="/" className="wordmark text-3xl">
        Labor<em>is</em>
      </Link>
      <SignIn />
    </div>
  );
}
