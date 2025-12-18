"use client";

import React, { useState, useEffect } from "react";
import { PortScanForm } from '@/components/port-scan-form';
import { PortScanResults } from '@/components/port-scan-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, AlertCircle, Shield, Lock, Cpu, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Tipo para los resultados del escaneo
export interface ScanResult {
  ip: string;
  port: number;
  status: 'open' | 'closed' | 'filtered';
  service?: string;
  banner?: string;
  scanTime: string;
}

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanStats, setScanStats] = useState({
    totalScanned: 0,
    openPorts: 0,
    closedPorts: 0,
    filteredPorts: 0
  });
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

    // Mostrar toast de inicio
    toast.info('Iniciando escaneo de puertos...', {
      description: `Escaneando ${scanData.startIP} - ${scanData.ports.length} puertos`
    });

    try {
      // Por ahora, solo escaneamos el startIP. Para un rango, necesitaríamos iterar.
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: scanData.startIP,
          ports: scanData.ports,
          timeout: scanData.timeout,
          maxConcurrent: scanData.maxConcurrent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el escaneo');
      }

      const data = await response.json();
      const results: ScanResult[] = data.results;

      setScanResults(results);
      
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

      toast.success('Escaneo completado', {
        description: `Encontrados ${openPorts} puertos abiertos en ${scanData.startIP}`
      });
    } catch (error: any) {
      console.error('Error en el escaneo:', error);
      toast.error('Error en el escaneo', {
        description: error.message || 'No se pudo completar el escaneo. Inténtalo de nuevo.'
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
    console.log('[SCAN_CLEARED] Results cleared');
    toast.info('Resultados eliminados');
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
    toast.success('Resultados exportados como JSON');
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
    toast.success('Resultados exportados como CSV');
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
              <span className="font-mono text-green-400 text-sm">ETHICAL_H4CK3R_TOOLS</span>
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
                      : 'Configure and initiate scan to view results'}
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
                      Configure the target IP range and scanning parameters, then click "INITIATE_SCAN" to begin network analysis.
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
            // Ethical Hacking Tool - For authorized security testing only
          </p>
          <p className="text-gray-700 text-xs mt-1">
            v2.0.1 | Built for security professionals
          </p>
        </div>
      </div>
    </div>
  );
}