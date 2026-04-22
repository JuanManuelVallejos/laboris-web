import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-cream items-center justify-center px-4">
      <SignUp
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
