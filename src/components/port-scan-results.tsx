"use client";

import React from "react";
import { ScanResult } from "@/types/scan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Loader2, AlertTriangle, Network } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface PortScanResultsProps {
  results: ScanResult[];
  isScanning?: boolean;
}

const getStatusIcon = (status: ScanResult['status']) => {
  switch (status) {
    case 'open':
      return <CheckCircle className="h-4 w-4 text-green-500 animate-pulse" />;
    case 'closed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'filtered':
      return <Shield className="h-4 w-4 text-yellow-500" />;
  }
};

const getStatusColor = (status: ScanResult['status']) => {
  switch (status) {
    case 'open':
      return "bg-green-500/10 text-green-400 border-green-500/30";
    case 'closed':
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case 'filtered':
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  }
};

const getRiskLevel = (port: number, service?: string) => {
  const highRiskPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3389, 5900, 8080];
  const mediumRiskPorts = [135, 139, 161, 389, 636, 1433, 1521, 3306, 5432];
  
  if (highRiskPorts.includes(port)) return "HIGH";
  if (mediumRiskPorts.includes(port)) return "MEDIUM";
  if (service?.toLowerCase().includes('http') || service?.toLowerCase().includes('https')) return "MEDIUM";
  return "LOW";
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "HIGH":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "MEDIUM":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/30";
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
  const openPortsCount = results.filter(r => r.status === 'open').length;
  const highRiskCount = results.filter(r => r.status === 'open' && getRiskLevel(r.port, r.service) === "HIGH").length;

  if (isScanning) {
    const progress = Math.min(90, (results.length / 50) * 100);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-mono text-green-300">SCAN_IN_PROGRESS</h3>
            <p className="text-sm text-gray-400 font-mono">
              Analyzing network topology and services...
            </p>
          </div>
          <Loader2 className="h-5 w-5 text-green-400 animate-spin" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span className="font-mono">PROGRESS: {Math.round(progress)}%</span>
            <span>100%</span>
          </div>
          <Progress value={progress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          <div className="bg-black/30 p-4 rounded border border-green-500/30">
            <div className="h-4 bg-green-500/20 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-green-500/30 rounded w-1/2"></div>
          </div>
          <div className="bg-black/30 p-4 rounded border border-green-500/30">
            <div className="h-4 bg-green-500/20 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-green-500/30 rounded w-1/2"></div>
          </div>
          <div className="bg-black/30 p-4 rounded border border-green-500/30">
            <div className="h-4 bg-green-500/20 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-green-500/30 rounded w-1/2"></div>
          </div>
          <div className="bg-black/30 p-4 rounded border border-green-500/30">
            <div className="h-4 bg-green-500/20 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-green-500/30 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="text-center py-8">
          <Network className="h-12 w-12 text-green-500/30 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500 font-mono text-sm">Discovering active hosts and services...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Security Summary */}
      <Card className="hacker-card border-green-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono text-green-300">SECURITY_SUMMARY</CardTitle>
            {highRiskCount > 0 && (
              <Badge variant="destructive" className="font-mono animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highRiskCount} HIGH_RISK
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 p-4 rounded border border-green-500/30">
              <div className="text-2xl font-bold font-mono text-green-400">{uniqueIPs.length}</div>
              <div className="text-xs text-gray-400 mt-1">ACTIVE_HOSTS</div>
            </div>
            <div className="bg-black/30 p-4 rounded border border-green-500/30">
              <div className="text-2xl font-bold font-mono text-green-500">{openPortsCount}</div>
              <div className="text-xs text-gray-400 mt-1">OPEN_PORTS</div>
            </div>
            <div className="bg-black/30 p-4 rounded border border-yellow-500/30">
              <div className="text-2xl font-bold font-mono text-yellow-500">
                {results.filter(r => r.status === 'filtered').length}
              </div>
              <div className="text-xs text-gray-400 mt-1">FILTERED</div>
            </div>
            <div className="bg-black/30 p-4 rounded border border-red-500/30">
              <div className="text-2xl font-bold font-mono text-red-400">
                {highRiskCount}
              </div>
              <div className="text-xs text-gray-400 mt-1">HIGH_RISK</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results Table */}
      <div className="rounded border border-green-500/30 overflow-hidden">
        <div className="bg-gray-900/50 px-4 py-2 border-b border-green-500/30">
          <h3 className="font-mono text-green-300 text-sm">DETAILED_RESULTS</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-green-500/30 hover:bg-green-500/5">
                <TableHead className="font-mono text-green-300 w-[150px]">HOST_IP</TableHead>
                <TableHead className="font-mono text-green-300 w-[100px]">PORT</TableHead>
                <TableHead className="font-mono text-green-300 w-[120px]">STATUS</TableHead>
                <TableHead className="font-mono text-green-300 w-[100px]">RISK</TableHead>
                <TableHead className="font-mono text-green-300 w-[150px]">SERVICE</TableHead>
                <TableHead className="font-mono text-green-300">BANNER_INFO</TableHead>
                <TableHead className="font-mono text-green-300 text-right w-[100px]">TIME</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => {
                const riskLevel = getRiskLevel(result.port, result.service);
                
                return (
                  <TableRow 
                    key={`${result.ip}-${result.port}-${index}`} 
                    className="border-green-500/10 hover:bg-green-500/5 transition-colors"
                  >
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        <Network className="h-3 w-3 text-green-500" />
                        {result.ip}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono border-green-500/30">
                        {result.port}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <Badge className={getStatusColor(result.status)}>
                          <span className="font-mono text-xs">
                            {result.status === 'open' ? 'OPEN' : 
                             result.status === 'closed' ? 'CLOSED' : 'FILTERED'}
                          </span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`font-mono text-xs ${getRiskColor(riskLevel)}`}>
                        {riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {result.service ? (
                        <div className="font-mono font-medium">{result.service}</div>
                      ) : (
                        <span className="text-gray-500 font-mono text-sm">UNKNOWN</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate font-mono text-sm" title={result.banner}>
                        {result.banner || (
                          <span className="text-gray-500">No banner info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-xs text-gray-400">
                        {new Date(result.scanTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Grouped View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-green-300 text-lg">HOST_SUMMARY</h3>
          <Badge variant="outline" className="font-mono border-green-500/30 text-green-400">
            {uniqueIPs.length} HOSTS
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniqueIPs.map((ip) => {
            const ipResults = groupedByIP[ip];
            const openPorts = ipResults.filter(r => r.status === 'open');
            const highRiskPorts = openPorts.filter(r => getRiskLevel(r.port, r.service) === "HIGH");
            
            return (
              <Card key={ip} className="hacker-card border-green-500/30 hover:border-green-500/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${openPorts.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                      <CardTitle className="font-mono text-base">{ip}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={openPorts.length > 0 ? "default" : "secondary"} className="font-mono">
                        {openPorts.length} OPEN
                      </Badge>
                      {highRiskPorts.length > 0 && (
                        <Badge variant="destructive" className="font-mono animate-pulse">
                          {highRiskPorts.length} HIGH
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {openPorts.length > 0 ? (
                      openPorts.map((result, index) => {
                        const riskLevel = getRiskLevel(result.port, result.service);
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(result.status)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-medium">{result.port}</span>
                                  {result.service && (
                                    <span className="text-gray-400 font-mono text-xs">({result.service})</span>
                                  )}
                                </div>
                                {result.banner && (
                                  <div className="text-gray-500 text-xs truncate max-w-[200px]" title={result.banner}>
                                    {result.banner}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge className={`font-mono text-xs ${getRiskColor(riskLevel)}`}>
                              {riskLevel}
                            </Badge>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <Shield className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 font-mono text-sm">No open ports detected</p>
                      </div>
                    )}
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