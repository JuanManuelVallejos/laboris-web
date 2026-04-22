import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-cream items-center justify-center px-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#5C6B3A",
            colorBackground: "#FFFFFF",
            colorInputBackground: "#F7F3ED",
            borderRadius: "1rem",
          },
        }}
      />
    </div>
  );
}
