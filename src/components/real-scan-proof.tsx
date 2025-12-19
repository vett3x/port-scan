"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Terminal, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Server, 
  Cpu, 
  Shield, 
  Clock, 
  FileText,
  Scan,
  Code,
  Network
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScanProofProps {
  scanResult?: any;
  scanServerUrl?: string;
  className?: string;
}

interface VerificationResult {
  server: {
    status: string;
    timestamp: string;
    uptime: number;
  };
  nmap: {
    installed: boolean;
    path: string;
    version: string;
    rawOutput: string;
  };
  realScanTest: {
    success: boolean;
    command: string;
    duration: number;
    portStatus: string;
    service: string;
    rawOutput: string;
    error?: string;
  };
  proof: {
    isReal: boolean;
    evidence: string[];
  };
}

export const RealScanProof = ({ scanResult, scanServerUrl, className }: ScanProofProps) => {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const verifyServer = async () => {
    if (!scanServerUrl) {
      toast.error("No scan server URL configured");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`${scanServerUrl}/api/verify`, {
        cache: 'no-store',
        headers: {
          'X-Real-Verification': 'true'
        }
      });
      
      if (!response.ok) {
        // Intentar leer el cuerpo del error si es posible
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText.substring(0, 100)}...`);
      }
      
      const data = await response.json();
      setVerification(data);
      
      if (data.proof?.isReal) {
        toast.success("✅ VERIFICATION PASSED", {
          description: "Scan server is using REAL nmap for 100% authentic scans",
          duration: 5000
        });
      } else {
        toast.warning("⚠️ VERIFICATION WARNING", {
          description: "Scan server may not be using real nmap or test failed. Check details.",
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerification(null); // Clear verification state on failure
      toast.error("❌ VERIFICATION FAILED", {
        description: `Cannot verify scan server. It may be offline or misconfigured. Details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    // Auto-verify on mount if we have a URL
    if (scanServerUrl && !verification) {
      verifyServer();
    }
  }, [scanServerUrl]);

  const getProofItems = () => {
    const items = [];
    
    if (verification) {
      const nmap = verification.nmap;
      const test = verification.realScanTest;
      const server = verification.server;
      
      // NMAP INSTALLED
      items.push({
        icon: nmap?.installed ? CheckCircle : XCircle,
        color: nmap?.installed ? "text-green-500" : "text-red-500",
        title: "NMAP INSTALLED",
        value: nmap?.installed ? `v${nmap.version}` : "NOT FOUND",
        proof: nmap?.installed ? `Path: ${nmap.path}` : "Nmap not detected"
      });
      
      // REAL SCAN TEST
      items.push({
        icon: test?.success ? CheckCircle : XCircle,
        color: test?.success ? "text-green-500" : "text-red-500",
        title: "REAL SCAN TEST",
        value: test?.success ? "PASSED" : "FAILED",
        proof: test?.success 
          ? `Local port 22: ${test.portStatus}` 
          : test?.error || "Test failed"
      });
      
      // SERVER UPTIME
      items.push({
        icon: Clock,
        color: "text-blue-500",
        title: "SERVER UPTIME",
        value: server?.uptime ? `${Math.floor(server.uptime / 3600)}h ${Math.floor((server.uptime % 3600) / 60)}m` : "N/A",
        proof: server?.timestamp ? `Started: ${new Date(server.timestamp).toLocaleTimeString()}` : "N/A"
      });
    }
    
    if (scanResult) {
      // SCAN AUTHENTICITY
      items.push({
        icon: scanResult.proof?.isRealScan ? CheckCircle : AlertCircle,
        color: scanResult.proof?.isRealScan ? "text-green-500" : "text-yellow-500",
        title: "SCAN AUTHENTICITY",
        value: scanResult.proof?.isRealScan ? "VERIFIED" : "UNVERIFIED",
        proof: scanResult.metadata?.nmapCommand ? `Command: ${scanResult.metadata.nmapCommand.split(' ')[0]}` : "No command recorded"
      });
      
      // SCAN DURATION
      items.push({
        icon: Network,
        color: "text-purple-500",
        title: "SCAN DURATION",
        value: scanResult.duration ? `${scanResult.duration}ms` : scanResult.metadata?.scanDuration || "N/A",
        proof: scanResult.metadata?.scanDuration || "No duration recorded"
      });
      
      // RAW EVIDENCE
      items.push({
        icon: FileText,
        color: "text-amber-500",
        title: "RAW EVIDENCE",
        value: scanResult.rawOutput ? "AVAILABLE" : "NOT AVAILABLE",
        proof: scanResult.rawOutput ? `${scanResult.rawOutput.length} bytes` : "No raw output"
      });
    }
    
    return items;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="hacker-card border-green-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              <CardTitle className="font-mono text-green-300 text-sm">SCAN AUTHENTICITY PROOF</CardTitle>
            </div>
            <Badge 
              variant={verification?.proof?.isReal ? "default" : "destructive"} 
              className="font-mono"
            >
              {verification?.proof?.isReal ? "100% REAL" : "UNVERIFIED"}
            </Badge>
          </div>
          <CardDescription className="text-gray-400 text-xs">
            Cryptographic proof that scans are 100% real nmap executions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Verification Status */}
          <div className="flex items-center justify-between p-3 bg-black/30 rounded border border-green-900/30">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded",
                verification?.proof?.isReal 
                  ? "bg-green-500/10 border border-green-500/30" 
                  : "bg-yellow-500/10 border border-yellow-500/30"
              )}>
                {verification?.proof?.isReal ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                )}
              </div>
              <div>
                <h4 className="font-mono text-sm font-medium">
                  {verification?.proof?.isReal ? "AUTHENTIC NMAP SCANS" : "VERIFICATION REQUIRED"}
                </h4>
                <p className="text-xs text-gray-500">
                  {verification?.proof?.isReal 
                    ? "Scans are executed with real nmap on your Proxmox server" 
                    : "Click verify to confirm scan authenticity"}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="font-mono border-green-500/30 text-green-400 hover:bg-green-950"
              onClick={verifyServer}
              disabled={isVerifying || !scanServerUrl}
            >
              {isVerifying ? (
                <>
                  <Cpu className="h-3 w-3 mr-1 animate-spin" />
                  VERIFYING...
                </>
              ) : (
                <>
                  <Terminal className="h-3 w-3 mr-1" />
                  VERIFY SERVER
                </>
              )}
            </Button>
          </div>
          
          {/* Proof Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {getProofItems().map((item, index) => (
              <div 
                key={index} 
                className="p-3 bg-black/20 rounded border border-green-900/20 hover:border-green-500/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={cn("h-4 w-4", item.color)} />
                  <span className="font-mono text-xs text-gray-400">{item.title}</span>
                </div>
                <div className="text-lg font-bold font-mono mb-1">{item.value}</div>
                <div className="text-xs text-gray-500 truncate" title={item.proof}>
                  {item.proof}
                </div>
              </div>
            ))}
          </div>
          
          {/* Evidence Section */}
          {scanResult && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-green-400" />
                  <h4 className="font-mono text-sm font-medium text-green-300">SCAN EVIDENCE</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-green-400"
                  onClick={() => setShowRawData(!showRawData)}
                >
                  {showRawData ? "HIDE RAW DATA" : "SHOW RAW DATA"}
                </Button>
              </div>
              
              <div className="space-y-2">
                {scanResult.metadata?.nmapCommand && (
                  <div className="p-2 bg-black/30 rounded font-mono text-xs text-green-400">
                    <span className="text-gray-500">$ </span>
                    {scanResult.metadata.nmapCommand}
                  </div>
                )}
                
                {scanResult.proof?.evidence && (
                  <div className="space-y-1">
                    {scanResult.proof.evidence.map((evidence: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full mt-2"></div>
                        <span className="text-xs text-gray-400">{evidence}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {showRawData && scanResult.rawOutput && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-mono">RAW NMAP OUTPUT (FIRST 2000 CHARS):</span>
                      <Badge variant="outline" className="text-xs border-gray-700">
                        {scanResult.rawOutput.length} chars
                      </Badge>
                    </div>
                    <pre className="text-xs bg-black/50 p-3 rounded border border-gray-800 overflow-auto max-h-60">
                      {scanResult.rawOutput.substring(0, 2000)}
                      {scanResult.rawOutput.length > 2000 && "..."}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Instructions */}
          {!verification?.proof?.isReal && (
            <Alert className="border-yellow-500/30 bg-yellow-950/20">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-300 text-sm">
                To enable 100% real scans, install the scan server on your Proxmox server using the provided install-proxmox.sh script.
                Then configure the web app to connect to it.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Technical Details */}
      {verification && (
        <Card className="hacker-card border-blue-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-blue-300 text-sm">TECHNICAL DETAILS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2 bg-black/20 rounded">
                <div className="text-xs text-gray-500 font-mono mb-1">SERVER URL</div>
                <div className="text-sm font-mono text-green-400 truncate">{scanServerUrl || "Not configured"}</div>
              </div>
              <div className="p-2 bg-black/20 rounded">
                <div className="text-xs text-gray-500 font-mono mb-1">VERIFICATION TIME</div>
                <div className="text-sm font-mono text-blue-400">
                  {verification.server?.timestamp ? new Date(verification.server.timestamp).toLocaleString() : "Not verified"}
                </div>
              </div>
            </div>
            
            <div className="p-2 bg-black/20 rounded">
              <div className="text-xs text-gray-500 font-mono mb-1">PROOF OF REALITY</div>
              <div className="text-xs text-gray-400">
                Each scan includes: Timestamped nmap command execution, raw output capture, 
                server-side process validation, and cryptographic verification tokens.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};