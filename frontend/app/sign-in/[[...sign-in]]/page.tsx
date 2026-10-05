import { SignIn } from "@clerk/nextjs";
import Wordmark from "@/components/Wordmark";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <Wordmark />
      <SignIn />
    </main>
  );
}
