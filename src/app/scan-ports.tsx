"use client";

import { PortScanForm } from "@/components/port-scan-form";

export default function ScanPorts() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Port Scanner</h1>
      <PortScanForm />
    </div>
  );
}