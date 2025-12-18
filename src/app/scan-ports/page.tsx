"use client";

import React, { useState } from "react";
import { PortScanForm } from '@/components/port-scan-form';
import { PortScanResults } from '@/components/port-scan-results';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScanResult } from '@/types/scan';

// Datos de ejemplo para demostración
const sampleResults: ScanResult[] = [
  { ip: '192.168.1.1', port: 80, status: 'open', service: 'HTTP', banner: 'Apache/2.4.41', scanTime: '2024-01-15 10:30:22' },
  { ip: '192.168.1.1', port: 443, status: 'open', service: 'HTTPS', banner: 'nginx/1.18.0', scanTime: '2024-01-15 10:30:23' },
  { ip: '192.168.1.1', port: 22, status: 'open', service: 'SSH', banner: 'OpenSSH 8.2p1', scanTime: '2024-01-15 10:30:24' },
  { ip: '192.168.1.2', port: 80, status: 'closed', service: undefined, scanTime: '2024-01-15 10:31:15' },
  { ip: '192.168.1.2', port: 3389, status: 'open', service: 'RDP', banner: 'Microsoft Terminal Services', scanTime: '2024-01-15 10:31:16' },
  { ip: '192.168.1.3', port: 21, status: 'filtered', service: 'FTP', scanTime: '2024-01-15 10:32:05' },
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
    console.log(`Iniciando escaneo de ${startIP} a ${endIP}`);
    setIsScanning(true);
    
    // Simular escaneo con datos de ejemplo
    setTimeout(() => {
      setScanResults(sampleResults);
      
      // Calcular estadísticas
      const openPorts = sampleResults.filter(r => r.status === 'open').length;
      const closedPorts = sampleResults.filter(r => r.status === 'closed').length;
      const filteredPorts = sampleResults.filter(r => r.status === 'filtered').length;
      
      setScanStats({
        totalScanned: sampleResults.length,
        openPorts,
        closedPorts,
        filteredPorts
      });
      
      setIsScanning(false);
    }, 2000);
  };

  const handleClearResults = () => {
    setScanResults([]);
    setScanStats({
      totalScanned: 0,
      openPorts: 0,
      closedPorts: 0,
      filteredPorts: 0
    });
  };

  const handleExportResults = () => {
    const dataStr = JSON.stringify(scanResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `port-scan-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Escáner de Puertos</h1>
        <p className="text-muted-foreground mt-2">
          Escanea un rango de direcciones IP para detectar puertos abiertos y servicios disponibles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de escaneo */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Escaneo</CardTitle>
              <CardDescription>
                Define el rango de IPs a escanear y los parámetros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortScanForm 
                onScanStart={handleScanStart}
                isScanning={isScanning}
              />
              
              {scanResults.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Puertos escaneados:</span>
                    <span className="font-semibold">{scanStats.totalScanned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Puertos abiertos:</span>
                    <span className="font-semibold text-green-600">{scanStats.openPorts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Puertos cerrados:</span>
                    <span className="font-semibold text-red-600">{scanStats.closedPorts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Puertos filtrados:</span>
                    <span className="font-semibold text-yellow-600">{scanStats.filteredPorts}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert className="mt-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Nota importante</AlertTitle>
            <AlertDescription>
              Este es un escáner de demostración. En una aplicación real, necesitarías implementar
              la lógica de escaneo real en el servidor para evitar problemas de CORS y seguridad.
            </AlertDescription>
          </Alert>
        </div>

        {/* Resultados del escaneo */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Resultados del Escaneo</CardTitle>
                <CardDescription>
                  {scanResults.length > 0 
                    ? `Mostrando ${scanResults.length} resultados` 
                    : 'Inicia un escaneo para ver los resultados aquí'}
                </CardDescription>
              </div>
              {scanResults.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportResults}>
                    Exportar JSON
                  </Button>
                  <Button variant="destructive" onClick={handleClearResults}>
                    Limpiar
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <PortScanResults 
                results={scanResults}
                isScanning={isScanning}
              />
              
              {!isScanning && scanResults.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay resultados</h3>
                  <p className="text-muted-foreground">
                    Configura un rango de IPs y haz clic en "Iniciar Escaneo" para comenzar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}