"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      className="button primary"
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/mcl-tw-public-resources/admin" })}
    >
      Sign in with GitHub
    </button>
  );
}
