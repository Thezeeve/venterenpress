"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

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
              onClick={() =>
                signIn("credentials", {
                  email,
                  password,
                  otp,
                  callbackUrl: "/dashboard",
                })
              }
            >
              Continue with email
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
