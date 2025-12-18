"use client";

import React, { useState } from "react";
import { PortScanForm } from '@/components/port-scan-form';
import { PortScanResults } from '@/components/port-scan-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, AlertCircle, Shield, Lock, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from "next/link";

// Tipo para los resultados del escaneo
export interface ScanResult {
  ip: string;
  port: number;
  status: 'open' | 'closed' | 'filtered';
  service?: string;
  banner?: string;
  scanTime: string;
}

// Datos de ejemplo para demostración (ahora con IPs públicas)
const sampleResults: ScanResult[] = [
  { ip: '8.8.8.8', port: 53, status: 'open', service: 'DNS', banner: 'Google Public DNS', scanTime: new Date().toISOString() },
  { ip: '1.1.1.1', port: 80, status: 'open', service: 'HTTP', banner: 'Cloudflare', scanTime: new Date().toISOString() },
  { ip: '8.8.4.4', port: 53, status: 'open', service: 'DNS', banner: 'Google Public DNS', scanTime: new Date().toISOString() },
  { ip: '142.250.185.78', port: 443, status: 'open', service: 'HTTPS', banner: 'Google', scanTime: new Date().toISOString() },
  { ip: '151.101.1.140', port: 80, status: 'open', service: 'HTTP', banner: 'Reddit', scanTime: new Date().toISOString() },
  { ip: '104.16.249.249', port: 443, status: 'open', service: 'HTTPS', banner: 'Cloudflare', scanTime: new Date().toISOString() },
  { ip: '192.0.2.1', port: 22, status: 'filtered', service: 'SSH', scanTime: new Date().toISOString() },
  { ip: '203.0.113.1', port: 3389, status: 'closed', service: 'RDP', scanTime: new Date().toISOString() },
];

export default function ScanPortsPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanStats, setScanStats] = useState({
    totalScanned: 0,
    openPorts: 0,
    closedPorts: 0,
    filteredPorts: 0
  });

  const handleScanStart = (startIP: string, endIP: string) => {
    console.log(`[SCAN_INITIATED] Target range: ${startIP} to ${endIP}`);
    setIsScanning(true);
    
    // Simular escaneo con datos de ejemplo
    setTimeout(() => {
      // Filtrar resultados basados en el rango de IP (simulación)
      const filteredResults = sampleResults.filter(result => {
        // Simulación simple - en realidad necesitarías lógica de rango de IP
        return Math.random() > 0.3; // 70% de probabilidad de incluir cada resultado
      });
      
      setScanResults(filteredResults);
      
      // Calcular estadísticas
      const openPorts = filteredResults.filter(r => r.status === 'open').length;
      const closedPorts = filteredResults.filter(r => r.status === 'closed').length;
      const filteredPorts = filteredResults.filter(r => r.status === 'filtered').length;
      
      setScanStats({
        totalScanned: filteredResults.length,
        openPorts,
        closedPorts,
        filteredPorts
      });
      
      setIsScanning(false);
      console.log(`[SCAN_COMPLETE] Found ${openPorts} open ports`);
    }, 3000);
  };

  const handleClearResults = () => {
    setScanResults([]);
    setScanStats({
      totalScanned: 0,
      openPorts: 0,
      closedPorts: 0,
      filteredPorts: 0
    });
    console.log('[SCAN_CLEARED] Results cleared');
  };

  const handleExportResults = () => {
    const dataStr = JSON.stringify(scanResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-scan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('[EXPORT] Results exported as JSON');
  };

  const handleExportCSV = () => {
    const headers = ['IP', 'Port', 'Status', 'Service', 'Banner', 'Scan Time'];
    const csvData = [
      headers.join(','),
      ...scanResults.map(r => [
        r.ip,
        r.port,
        r.status,
        r.service || 'Unknown',
        `"${r.banner || ''}"`,
        r.scanTime
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-scan-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('[EXPORT] Results exported as CSV');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <Link href="/" className="text-green-400 hover:text-green-300 transition-colors">
                <span className="font-mono text-sm">← BACK_TO_HOME</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-green-400 animate-spin" style={{animationDuration: '3s'}} />
              <span className="font-mono text-green-400 text-sm">SYSTEM_READY</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="h-8 w-8 text-green-400" />
            <h1 className="text-3xl md:text-4xl font-bold font-mono">
              <span className="text-gradient">PORT_SCANNER</span>
              <span className="text-green-500 ml-2">v2.0</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-mono text-sm">ADVANCED_NETWORK_ANALYSIS</span>
            </div>
            <div className="hidden md:block">|</div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Ethical Hacking Tool</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Configuración */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="hacker-card border-green-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-green-300">SCAN_CONFIG</CardTitle>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
                <CardDescription className="text-gray-400">
                  Configure target parameters and scanning options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortScanForm 
                  onScanStart={handleScanStart}
                  isScanning={isScanning}
                />
                
                {scanResults.length > 0 && (
                  <div className="mt-6 space-y-3 p-4 bg-black/30 rounded border border-green-900/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-400">TOTAL_SCANNED:</span>
                      <span className="font-mono font-semibold text-green-400">{scanStats.totalScanned}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-400">OPEN_PORTS:</span>
                      <span className="font-mono font-semibold text-green-500">{scanStats.openPorts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-400">FILTERED:</span>
                      <span className="font-mono font-semibold text-yellow-500">{scanStats.filteredPorts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-400">CLOSED:</span>
                      <span className="font-mono font-semibold text-red-400">{scanStats.closedPorts}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="hacker-card border-green-500/30">
              <CardHeader>
                <CardTitle className="font-mono text-green-300 text-sm">QUICK_ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-green-900 text-green-400 hover:bg-green-950 hover:text-green-300"
                  onClick={handleExportResults}
                  disabled={scanResults.length === 0}
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  <span className="font-mono">EXPORT_JSON</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-green-900 text-green-400 hover:bg-green-950 hover:text-green-300"
                  onClick={handleExportCSV}
                  disabled={scanResults.length === 0}
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  <span className="font-mono">EXPORT_CSV</span>
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={handleClearResults}
                  disabled={scanResults.length === 0}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="font-mono">CLEAR_RESULTS</span>
                </Button>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Alert className="hacker-card border-yellow-500/30">
              <Lock className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="font-mono text-yellow-400">SECURITY_NOTICE</AlertTitle>
              <AlertDescription className="text-gray-400 text-sm">
                This tool is for authorized security testing only. Always obtain proper permissions before scanning networks you don't own.
              </AlertDescription>
            </Alert>
          </div>

          {/* Panel derecho - Resultados */}
          <div className="lg:col-span-2">
            <Card className="hacker-card border-green-500/30 h-full">
              <CardHeader className="flex flex-row items-center justify-between border-b border-green-900/30 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-green-400" />
                    <CardTitle className="font-mono text-green-300">SCAN_RESULTS</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    {scanResults.length > 0 
                      ? `[${scanResults.length} results] Real-time network analysis` 
                      : 'Initiate scan to view results here'}
                  </CardDescription>
                </div>
                {scanResults.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded">
                      <span className="font-mono text-green-400 text-sm">ACTIVE</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <PortScanResults 
                  results={scanResults}
                  isScanning={isScanning}
                />
                
                {!isScanning && scanResults.length === 0 && (
                  <div className="text-center py-16">
                    <div className="relative inline-block mb-6">
                      <Terminal className="h-16 w-16 text-green-900/50 mx-auto" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-mono text-gray-400 mb-3">AWAITING_INPUT</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Configure the target IP range and scanning parameters above, then click "INITIATE_SCAN" to begin network analysis.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-green-500/50">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                )}

                {/* Scan Statistics */}
                {scanResults.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-800">
                    <h4 className="font-mono text-green-300 mb-4">SCAN_SUMMARY</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black/30 p-4 rounded border border-green-900/30">
                        <div className="text-2xl font-bold text-green-400 font-mono">{scanStats.totalScanned}</div>
                        <div className="text-xs text-gray-400 mt-1">TOTAL PORTS</div>
                      </div>
                      <div className="bg-black/30 p-4 rounded border border-green-500/30">
                        <div className="text-2xl font-bold text-green-500 font-mono">{scanStats.openPorts}</div>
                        <div className="text-xs text-gray-400 mt-1">OPEN PORTS</div>
                      </div>
                      <div className="bg-black/30 p-4 rounded border border-yellow-500/30">
                        <div className="text-2xl font-bold text-yellow-500 font-mono">{scanStats.filteredPorts}</div>
                        <div className="text-xs text-gray-400 mt-1">FILTERED</div>
                      </div>
                      <div className="bg-black/30 p-4 rounded border border-red-500/30">
                        <div className="text-2xl font-bold text-red-400 font-mono">{scanStats.closedPorts}</div>
                        <div className="text-xs text-gray-400 mt-1">CLOSED</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm font-mono">
            // This is a demonstration tool. For production use, implement proper authentication and authorization.
          </p>
        </div>
      </div>
    </div>
  );
}