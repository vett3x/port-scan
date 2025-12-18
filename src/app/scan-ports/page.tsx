"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScanPortsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/");
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400 font-mono">Redirecting to scanner...</p>
    </div>
  );
}