"use client";

import axios from "axios";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";
import TwoFactorForm from "./two-factor-form";

interface LoginFormProps {
  loginHint: string;
}

export default function LoginForm({
  loginHint,
}: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        identifier,
        password,
      });

      const data = response.data;

      console.log("LOGIN RESPONSE:", data);

      if (data.twoFactorRequired === true) {
        console.log("2FA required");

        setChallengeToken(data.challengeToken);

        return;
      }

      console.log("Login successful");

  window.location.href = "/dashboard";
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ?? "Login failed",
        );
      } else {
        setError("Unable to connect to the server");
      }
    } finally {
      setLoading(false);
    }
  }

  if (challengeToken) {
    return (
      <TwoFactorForm
        challengeToken={challengeToken}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-semibold">
          Sign in
        </h1>

        <p className="mb-8 text-sm text-zinc-600">
          Sign in to your account
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="identifier">
            {loginHint}
            </label>

            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(event) =>
                setIdentifier(event.target.value)
              }
              autoComplete="username"
              required
              className="h-12 rounded-xl border border-zinc-200 px-4 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
              className="h-12 rounded-xl border border-zinc-200 px-4 outline-none focus:border-zinc-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-black px-5 font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
