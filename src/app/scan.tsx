"use client";

import { PortScanner } from '@/components/PortScanner';

export default function Scan() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Port Scanner</h1>
      <PortScanner />
    </div>
  );
}