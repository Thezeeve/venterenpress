"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [authState, setAuthState] = useState<"idle" | "signing" | "redirecting">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleCredentialSignIn() {
    if (authState !== "idle") {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setAuthState("signing");

    const callbackUrl = searchParams.get("next") ?? "/dashboard";
    const result = await signIn("credentials", {
      email,
      password,
      otp,
      callbackUrl,
      redirect: false,
    });

    if (!result || result.error) {
      setAuthState("idle");
      setErrorMessage(result?.error ? `Sign in failed. ${result.error}` : "Sign in failed. Check your credentials and try again.");
      return;
    }

    setAuthState("redirecting");
    setSuccessMessage("Signed in successfully. Redirecting...");
    router.push(result.url ?? callbackUrl);
  }

  async function handleGoogleSignIn() {
    if (authState !== "idle") {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setAuthState("signing");
    await signIn("google", { callbackUrl: searchParams.get("next") ?? "/dashboard" });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <Badge>Authentication</Badge>
          <h1 className="font-serif text-5xl leading-tight">Secure access for every newsroom role</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
            Email/password, Google login, optional two-factor verification, and role-aware session handling for editors, journalists, and subscribers.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use seeded or connected provider credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <div className="rounded-[18px] border border-[#D8261D]/20 bg-[#D8261D]/8 px-4 py-3 text-sm text-[#8A1C16]">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {successMessage}
              </div>
            ) : null}
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input placeholder="2FA code" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <Button
              className="w-full"
              onClick={() => void handleCredentialSignIn()}
              disabled={authState !== "idle"}
            >
              {authState === "signing" ? "Signing in..." : authState === "redirecting" ? "Redirecting..." : "Continue with email"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void handleGoogleSignIn()}
              disabled={authState !== "idle"}
            >
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
