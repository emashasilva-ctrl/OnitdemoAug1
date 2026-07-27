"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

type AccountType = "customer" | "vendor";

export function SignupForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [accountType, setAccountType] = useState<AccountType>("customer");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <input type="hidden" name="next" value={next ?? "/"} />
      <input type="hidden" name="accountType" value={accountType} />

      <div className="flex flex-col gap-1.5">
        <Label>I&apos;m signing up as a...</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setAccountType("customer")}
            className={`rounded-xl border p-3 text-left transition-colors ${
              accountType === "customer"
                ? "border-primary bg-accent"
                : "border-border hover:bg-muted"
            }`}
          >
            <p className="font-medium text-foreground">Just a customer</p>
            <p className="text-sm text-muted-foreground">
              Book appointments and reservations
            </p>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("vendor")}
            className={`rounded-xl border p-3 text-left transition-colors ${
              accountType === "vendor"
                ? "border-primary bg-accent"
                : "border-border hover:bg-muted"
            }`}
          >
            <p className="font-medium text-foreground">Customer and vendor</p>
            <p className="text-sm text-muted-foreground">
              I also own a salon or restaurant
            </p>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-name">Full name</Label>
        <Input id="signup-name" name="name" required autoComplete="name" placeholder="Amaya Silva" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-phone">Phone number (optional)</Label>
        <Input
          id="signup-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+94 77 123 4567"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
