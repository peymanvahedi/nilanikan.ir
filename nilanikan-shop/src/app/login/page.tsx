"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "otp" | "password";

function ActualLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  return (
    <div>
      <h1>Login</h1>
      <p>Next URL after login: {next}</p>
    </div>
  );
}

function __ActualDefault() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActualLoginPage />
    </Suspense>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <__ActualDefault />
    </Suspense>
  );
}
