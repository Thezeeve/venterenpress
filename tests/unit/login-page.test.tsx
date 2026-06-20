import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mocks.signIn,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams(),
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a signing in state and redirects on success", async () => {
    const user = userEvent.setup();
    let resolveSignIn: ((value: { error?: string | null; url?: string | null }) => void) | null = null;
    mocks.signIn.mockReturnValue(new Promise<{ error?: string | null; url?: string | null }>((resolve) => {
      resolveSignIn = resolve;
    }));

    render(createElement(LoginPage));

    await user.type(screen.getByPlaceholderText("Email"), "admin@vanterenpress.com");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Continue with email" }));

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();

    resolveSignIn?.({ error: null, url: "/dashboard" });

    expect(await screen.findByText("Signed in successfully. Redirecting...")).toBeVisible();
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a clear error when credentials fail", async () => {
    const user = userEvent.setup();
    mocks.signIn.mockResolvedValue({ error: "Invalid credentials", url: null });

    render(createElement(LoginPage));

    await user.type(screen.getByPlaceholderText("Email"), "admin@vanterenpress.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Continue with email" }));

    expect(await screen.findByText("Sign in failed. Invalid credentials")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue with email" })).toBeEnabled();
  });
});
