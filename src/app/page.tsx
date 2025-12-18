"use client";

import React, { useState, useEffect } from "react";
import { PortScanForm } from '@/components/port-scan-form';
import { PortScanResults } from '@/components/port-scan-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, AlertCircle, Shield, Lock, Cpu, Scan, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ScanResult } from '@/types/scan';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanStats, setScanStats] = useState({
    totalScanned: 0,
    openPorts: 0,
    closedPorts: 0,
    filteredPorts: 0
  });
  const [scanMetadata, setScanMetadata] = useState<{
    host?: string;
    totalScanned?: number;
    openPorts?: number;
    scanDuration?: string;
  }>({});
  const [dots, setDots] = useState<Array<{left: string, top: string, delay: string}>>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Solo se ejecuta en el cliente
    setIsClient(true);
    const generatedDots = Array.from({ length: 20 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`
    }));
    setDots(generatedDots);
  }, []);

  const handleScanStart = async (scanData: {
    startIP: string;
    endIP: string;
    ports: number[];
    timeout: number;
    maxConcurrent: number;
  }) => {
    console.log(`[SCAN_INITIATED] Target: ${scanData.startIP} to ${scanData.endIP}, Ports: ${scanData.ports.length}`);
    setIsScanning(true);
    setScanResults([]);
    setScanStats({
      totalScanned: 0,
      openPorts: 0,
      closedPorts: 0,
      filteredPorts: 0
    });
    setScanMetadata({});

    // Validar que no sea localhost (por seguridad)
    if (scanData.startIP === 'localhost' || scanData.startIP === '127.0.0.1') {
      toast.error('Security restriction', {
        description: 'Scanning localhost is not allowed for security reasons'
      });
      setIsScanning(false);
      return;
    }

    // Mostrar toast de inicio
    const toastId = toast.loading('Initializing port scan...', {
      description: `Target: ${scanData.startIP} • Ports: ${scanData.ports.length}`
    });

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: scanData.startIP,
          ports: scanData.ports,
          timeout: scanData.timeout,
          maxConcurrent: Math.min(scanData.maxConcurrent, 10) // Limitar a 10 por seguridad
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan error');
      }

      const data = await response.json();
      const results: ScanResult[] = data.results;

      setScanResults(results);
      setScanMetadata(data.metadata || {});
      
      // Calcular estadísticas
      const openPorts = results.filter(r => r.status === 'open').length;
      const closedPorts = results.filter(r => r.status === 'closed').length;
      const filteredPorts = results.filter(r => r.status === 'filtered').length;
      
      setScanStats({
        totalScanned: results.length,
        openPorts,
        closedPorts,
        filteredPorts
      });

      toast.success('Scan completed', {
        id: toastId,
        description: `Found ${openPorts} open ports on ${scanData.startIP}`
      });

      // Si hay puertos abiertos, mostrar alerta
      if (openPorts > 0) {
        setTimeout(() => {
          toast.warning('Security Alert', {
            description: `${openPorts} open ports detected. Review security configuration.`
          });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error('Scan failed', {
        id: toastId,
        description: error.message || 'Unable to complete scan. Please try again.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearResults = () => {
    setScanResults([]);
    setScanStats({
      totalScanned: 0,
      openPorts: 0,
      closedPorts: 0,
      filteredPorts: 0
    });
    setScanMetadata({});
    console.log('[SCAN_CLEARED] Results cleared');
    toast.info('Results cleared');
  };

  const handleExportResults = () => {
    const dataStr = JSON.stringify({
      metadata: scanMetadata,
      results: scanResults,
      timestamp: new Date().toISOString(),
      tool: 'Ethical Port Scanner v2.0'
    }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-scan-${scanMetadata.host || 'target'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('[EXPORT] Results exported as JSON');
    toast.success('Results exported as JSON');
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
    link.download = `security-scan-${scanMetadata.host || 'target'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('[EXPORT] Results exported as CSV');
    toast.success('Results exported as CSV');
  };

  const handleQuickScan = (target: string) => {
    const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3389, 8080, 8443];
    
    handleScanStart({
      startIP: target,
      endIP: target,
      ports: commonPorts,
      timeout: 1500,
      maxConcurrent: 5
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Animated background elements - solo renderizar en cliente */}
      {isClient && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {dots.map((dot, i) => (
            <div
              key={i}
              className="absolute w-[1px] h-[1px] bg-green-500 animate-pulse"
              style={{
                left: dot.left,
                top: dot.top,
                animationDelay: dot.delay,
                boxShadow: '0 0 10px 2px #22c55e'
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-mono text-green-400 text-sm">REAL_PORT_SCANNER</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-green-400 animate-spin" style={{animationDuration: '3s'}} />
              <span className="font-mono text-green-400 text-sm">
                {isScanning ? 'SCANNING_ACTIVE' : 'SYSTEM_READY'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="h-8 w-8 text-green-400" />
            <h1 className="text-3xl md:text-4xl font-bold font-mono">
              <span className="text-gradient">REAL_PORT_SCANNER</span>
              <span className="text-green-500 ml-2">v2.1</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-mono text-sm">LIVE_NETWORK_SCANNING</span>
            </div>
            <div className="hidden md:block">|</div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Real port detection using portscanner</span>
            </div>
          </div>
        </div>

        {/* Quick Targets Banner */}
        <div className="mb-6 p-4 bg-black/30 rounded-lg border border-green-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-green-400" />
              <span className="font-mono text-green-300">QUICK_SCAN_TARGETS:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Google DNS', value: '8.8.8.8' },
                { label: 'Cloudflare', value: '1.1.1.1' },
                { label: 'Example Domain', value: 'example.com' },
              ].map((target) => (
                <Button
                  key={target.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-green-900 text-green-400 hover:bg-green-950 font-mono text-xs"
                  onClick={() => handleQuickScan(target.value)}
                  disabled={isScanning}
                >
                  {target.label}
                </Button>
              ))}
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
                  Configure target parameters for real network scanning
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
                      <span className="text-sm font-mono text-gray-400">TARGET:</span>
                      <span className="font-mono font-semibold text-green-400">{scanMetadata.host || 'Unknown'}</span>
                    </div>
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
                <CardTitle className="font-mono text-green-300 text-sm">RESULT_ACTIONS</CardTitle>
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

            {/* Real Scan Notice */}
            <Alert className="hacker-card border-green-500/30">
              <Scan className="h-4 w-4 text-green-500" />
              <AlertTitle className="font-mono text-green-400">REAL_SCANNING_ACTIVE</AlertTitle>
              <AlertDescription className="text-gray-400 text-sm">
                This scanner performs actual network connections to detect open ports. 
                Scans may take longer and results depend on network conditions and firewalls.
              </AlertDescription>
            </Alert>

            {/* Security Notice */}
            <Alert className="hacker-card border-yellow-500/30">
              <Lock className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="font-mono text-yellow-400">SECURITY_NOTICE</AlertTitle>
              <AlertDescription className="text-gray-400 text-sm">
                This tool performs real network scans. Only scan networks you own or have explicit permission to test.
                Unauthorized scanning may be illegal in your jurisdiction.
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
                      ? `[${scanResults.length} ports scanned] Real network analysis` 
                      : 'Configure scan parameters and click INITIATE_SCAN'}
                  </CardDescription>
                </div>
                {scanResults.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 border rounded font-mono text-sm ${
                      scanStats.openPorts > 0 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' 
                        : 'bg-green-500/10 border-green-500/30 text-green-400'
                    }`}>
                      {scanStats.openPorts > 0 ? 'VULNERABLE' : 'SECURE'}
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
                      <Scan className="h-16 w-16 text-green-900/50 mx-auto" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-mono text-gray-400 mb-3">READY_FOR_REAL_SCAN</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      This scanner performs actual network connections to detect open ports. 
                      Enter a target IP or domain, select ports, and click "INITIATE_SCAN".
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                      {['8.8.8.8', '1.1.1.1', 'example.com'].map((target) => (
                        <Button
                          key={target}
                          variant="outline"
                          size="sm"
                          className="border-green-900 text-green-400 hover:bg-green-950"
                          onClick={() => handleQuickScan(target)}
                        >
                          Scan {target}
                        </Button>
                      ))}
                    </div>
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
                    
                    {scanMetadata.host && (
                      <div className="mt-4 p-4 bg-black/20 rounded border border-gray-800">
                        <div className="font-mono text-sm text-gray-400">
                          Target: <span className="text-green-400">{scanMetadata.host}</span> • 
                          Scan ID: <span className="text-blue-400">{Date.now().toString(36)}</span> • 
                          Time: <span className="text-yellow-400">{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm font-mono">
            // Real Port Scanner v2.1 • Uses portscanner library for actual network connections
          </p>
          <p className="text-gray-700 text-xs mt-1">
            IMPORTANT: Only scan networks you own or have permission to test. Results may vary based on network conditions.
          </p>
        </div>
      </div>
    </div>
  );
}