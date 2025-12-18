"use client";

import React from "react";
import { ScanResult } from "@/types/scan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface PortScanResultsProps {
  results: ScanResult[];
  isScanning?: boolean;
}

const getStatusIcon = (status: ScanResult['status']) => {
  switch (status) {
    case 'open':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'closed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'filtered':
      return <Shield className="h-4 w-4 text-yellow-500" />;
  }
};

const getStatusColor = (status: ScanResult['status']) => {
  switch (status) {
    case 'open':
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case 'closed':
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case 'filtered':
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
  }
};

export const PortScanResults = ({ results, isScanning = false }: PortScanResultsProps) => {
  // Agrupar resultados por IP
  const groupedByIP = results.reduce((acc, result) => {
    if (!acc[result.ip]) {
      acc[result.ip] = [];
    }
    acc[result.ip].push(result);
    return acc;
  }, {} as Record<string, ScanResult[]>);

  const uniqueIPs = Object.keys(groupedByIP);

  if (isScanning) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Escaneo en progreso</h3>
            <p className="text-sm text-muted-foreground">
              Analizando puertos y servicios...
            </p>
          </div>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <Progress value={33} className="h-2" />
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IPs Escaneadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueIPs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Puertos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Puertos Abiertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {results.filter((r: ScanResult) => r.status === 'open').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Último Escaneo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {results.length > 0 
                ? new Date(results[0].scanTime).toLocaleTimeString()
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de resultados */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Dirección IP</TableHead>
              <TableHead className="w-[100px]">Puerto</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[150px]">Servicio</TableHead>
              <TableHead>Banner/Información</TableHead>
              <TableHead className="text-right">Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result: ScanResult, index: number) => (
              <TableRow key={`${result.ip}-${result.port}-${index}`}>
                <TableCell className="font-medium">{result.ip}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {result.port}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <Badge className={getStatusColor(result.status)}>
                      {result.status === 'open' ? 'Abierto' : 
                       result.status === 'closed' ? 'Cerrado' : 'Filtrado'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {result.service ? (
                    <span className="font-medium">{result.service}</span>
                  ) : (
                    <span className="text-muted-foreground">Desconocido</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={result.banner}>
                  {result.banner || (
                    <span className="text-muted-foreground">Sin información</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {new Date(result.scanTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vista agrupada por IP */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Vista Agrupada por IP</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniqueIPs.map((ip) => {
            const ipResults = groupedByIP[ip];
            const openPorts = ipResults.filter((r: ScanResult) => r.status === 'open').length;
            
            return (
              <Card key={ip}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{ip}</CardTitle>
                    <Badge variant={openPorts > 0 ? "default" : "secondary"}>
                      {openPorts} puerto{openPorts !== 1 ? 's' : ''} abierto{openPorts !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ipResults.map((result: ScanResult, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-mono">{result.port}</span>
                          {result.service && (
                            <span className="text-muted-foreground">({result.service})</span>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusColor(result.status)}>
                          {result.status === 'open' ? 'Abierto' : 
                           result.status === 'closed' ? 'Cerrado' : 'Filtrado'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};