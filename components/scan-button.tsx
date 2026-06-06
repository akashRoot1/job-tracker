"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function ScanButton({ accountId }: { accountId?: string }) {
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountId ? { accountId } : {})
    });
    window.location.reload();
  }

  return (
    <button onClick={scan} disabled={loading} className="btn">
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Scanning" : "Scan Now"}
    </button>
  );
}
