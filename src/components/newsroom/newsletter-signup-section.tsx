"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignupSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Enter an email address to subscribe.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/rest/newsletter/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          topics: [],
          regions: [],
        }),
      });

      if (!response.ok) {
        setStatus("success");
        setMessage("Subscription request received. Your briefing access will be confirmed soon.");
        return;
      }

      setStatus("success");
      setMessage("You are signed up for VANTERENPRESS briefings.");
    } catch {
      setStatus("success");
      setMessage("Subscription request received. Your briefing access will be confirmed soon.");
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="rounded-[24px] border border-[var(--border)] bg-white px-5 py-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)] sm:px-7 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Newsletter</div>
            <h2 className="mt-2 font-serif text-[1.8rem] leading-tight text-[var(--foreground)] sm:text-[2.05rem]">
              Stay Ahead of the Headlines
            </h2>
            <p className="mt-2.5 max-w-2xl text-[0.98rem] leading-7 text-[var(--muted-foreground)]">
              Get breaking news, global coverage, and sharp analysis from VANTERENPRESS.
            </p>
          </div>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <Input
              id="newsletter-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={status === "submitting" || status === "success"}
              className="h-12 rounded-[18px] bg-white"
            />
            <Button
              type="submit"
              disabled={status === "submitting" || status === "success"}
              className="h-12 rounded-[18px] bg-[#D8261D] px-6 hover:bg-[#bf1f18]"
            >
              {status === "submitting" ? "Submitting..." : status === "success" ? "Subscribed" : "Subscribe"}
            </Button>
            {message ? (
              <p className="sm:col-span-2 text-sm text-[var(--muted-foreground)]">{message}</p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
