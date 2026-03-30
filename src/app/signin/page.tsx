"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function SwitchAccountHandler() {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("switch") === "true") {
      signIn("google", { callbackUrl: "/" });
    }
  }, [params]);
  return null;
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Suspense>
          <SwitchAccountHandler />
        </Suspense>

        {/* Logo / wordmark */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-semibold tracking-[-0.03em] text-[#0a0a0a]"
              style={{ letterSpacing: "-0.04em" }}
            >
              SUPPLEMENT MANAGER
            </span>
            <Dots />
          </div>
          <p className="text-sm text-[#737373]">Your personal supplement tracker</p>
        </div>

        {/* Card */}
        <div className="rounded-[20px] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.06)]">
          <h1 className="mb-1 text-lg font-semibold tracking-[-0.01em] text-[#0a0a0a]">
            Sign in
          </h1>
          <p className="mb-6 text-sm text-[#737373]">
            Track your supplements, stay consistent.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#0a0a0a] text-sm font-semibold text-white transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-[0.98]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-[#a3a3a3]">
            Personal use only — your data stays yours.
          </p>
        </div>

      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#fff"
        fillOpacity=".9"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#fff"
        fillOpacity=".7"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#fff"
        fillOpacity=".6"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#fff"
        fillOpacity=".5"
      />
    </svg>
  );
}

function Dots() {
  return (
    <span
      className="pointer-events-none select-none"
      aria-hidden
      style={{ position: "relative", display: "inline-block", width: 24, height: 16 }}
    >
      <span style={{ position: "absolute", top: -4, left: 2, width: 4, height: 4, borderRadius: "50%", background: "#0a0a0a", opacity: 0.18 }} />
      <span style={{ position: "absolute", top: 6, left: 14, width: 5, height: 5, borderRadius: "50%", background: "#0a0a0a", opacity: 0.12 }} />
      <span style={{ position: "absolute", top: -2, left: 20, width: 3, height: 3, borderRadius: "50%", background: "#0a0a0a", opacity: 0.2 }} />
    </span>
  );
}
