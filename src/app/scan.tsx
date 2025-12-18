"use client";

import { PortScan } from '@/components/port-scan';

export default function ScanPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Port Scan</h1>
      <PortScan />
    </div>
  );
}