"use client";

import { Suspense } from "react";
import CallbackHandler from "./handler";

export const dynamic = "force-dynamic";

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Completing sign in...</h2>
            <p className="text-gray-600">Please wait while we authenticate you.</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}