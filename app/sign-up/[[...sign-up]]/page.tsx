import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-page items-center justify-center px-4 gap-6">
      <Link href="/" className="wordmark text-3xl">
        Labor<em>is</em>
      </Link>
      <SignUp />
    </div>
  );
}
