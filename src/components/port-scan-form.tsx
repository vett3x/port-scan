"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Scan, Target, Cpu, Shield, Zap, Globe, Server } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

// Esquema de validación con Zod
const PortScanSchema = z.object({
  startIP: z.string()
    .min(1, "IP address required")
    .regex(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/, 
      "Invalid IP or domain format (e.g., 8.8.8.8 or example.com)"),
  endIP: z.string()
    .min(1, "IP address required")
    .regex(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/, 
      "Invalid IP or domain format"),
  portRange: z.string().optional(),
  scanType: z.enum(["stealth", "aggressive", "comprehensive", "custom"]),
  timeout: z.number().min(500).max(10000),
  maxConcurrent: z.number().min(1).max(10), // Limitar a 10 por seguridad
});

type PortScanFormValues = z.infer<typeof PortScanSchema>;

interface PortScanFormProps {
  onScanStart: (data: {
    startIP: string;
    endIP: string;
    ports: number[];
    timeout: number;
    maxConcurrent: number;
  }) => void;
  isScanning: boolean;
  disabled?: boolean;
}

export const PortScanForm = ({ onScanStart, isScanning, disabled = false }: PortScanFormProps) => {
  const [scanType, setScanType] = useState<"stealth" | "aggressive" | "comprehensive" | "custom">("stealth");
  const [useCommonPorts, setUseCommonPorts] = useState(true);
  const [timeout, setTimeout] = useState(1500);
  const [maxConcurrent, setMaxConcurrent] = useState(5);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, trigger } = useForm<PortScanFormValues>({
    resolver: zodResolver(PortScanSchema),
    defaultValues: {
      startIP: "",
      endIP: "",
      portRange: "21,22,23,25,53,80,110,143,443,465,587,993,995,3389,8080,8443",
      scanType: "stealth",
      timeout: 1500,
      maxConcurrent: 5,
    }
  });

  const onSubmit = async (data: PortScanFormValues) => {
    console.log("[FORM_SUBMIT] Scan configuration:", data);
    
    // Validar que no sea localhost
    if (data.startIP === 'localhost' || data.startIP === '127.0.0.1') {
      toast.error('Security restriction', {
        description: 'Scanning localhost is not allowed'
      });
      return;
    }
    
    // Parsear los puertos
    let ports: number[] = [];
    if (data.portRange) {
      if (data.portRange.includes(',')) {
        ports = data.portRange.split(',').map(port => parseInt(port.trim())).filter(port => !isNaN(port) && port > 0 && port <= 65535);
      } else if (data.portRange.includes('-')) {
        const [start, end] = data.portRange.split('-').map(port => parseInt(port.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end && start > 0 && end <= 65535) {
          for (let port = start; port <= Math.min(end, start + 100); port++) { // Limitar rango
            ports.push(port);
          }
        }
      } else {
        const port = parseInt(data.portRange);
        if (!isNaN(port) && port > 0 && port <= 65535) {
          ports = [port];
        }
      }
    }
    
    // Si no se pudieron parsear puertos, usar los comunes
    if (ports.length === 0) {
      ports = [21,22,23,25,53,80,110,143,443,465,587,993,995,3389,8080,8443];
    }
    
    // Limitar número de puertos
    const limitedPorts = ports.slice(0, 50);
    
    if (limitedPorts.length < ports.length) {
      toast.warning('Port limit applied', {
        description: `Limited to 50 ports for performance`
      });
    }
    
    onScanStart({
      startIP: data.startIP,
      endIP: data.endIP,
      ports: limitedPorts,
      timeout: data.timeout,
      maxConcurrent: data.maxConcurrent,
    });
  };

  const handleScanTypeChange = (value: "stealth" | "aggressive" | "comprehensive" | "custom") => {
    setScanType(value);
    setValue("scanType", value);
    
    // Ajustar configuración según el tipo de escaneo
    switch (value) {
      case "stealth":
        setUseCommonPorts(true);
        setTimeout(2000);
        setMaxConcurrent(3);
        setValue("timeout", 2000);
        setValue("maxConcurrent", 3);
        setValue("portRange", "21,22,23,25,53,80,110,143,443,465,587,993,995,3389,8080,8443");
        break;
      case "aggressive":
        setUseCommonPorts(true);
        setTimeout(800);
        setMaxConcurrent(8);
        setValue("timeout", 800);
        setValue("maxConcurrent", 8);
        setValue("portRange", "21,22,23,25,53,80,110,143,443,465,587,993,995,3389,8080,8443");
        break;
      case "comprehensive":
        setUseCommonPorts(false);
        setTimeout(3000);
        setMaxConcurrent(2);
        setValue("timeout", 3000);
        setValue("maxConcurrent", 2);
        setValue("portRange", "1-1024");
        break;
      case "custom":
        setShowAdvanced(true);
        break;
    }
  };

  const commonTargets = [
    { label: "Google DNS", value: "8.8.8.8", icon: <Globe className="h-3 w-3" /> },
    { label: "Cloudflare", value: "1.1.1.1", icon: <Zap className="h-3 w-3" /> },
    { label: "OpenDNS", value: "208.67.222.222", icon: <Shield className="h-3 w-3" /> },
  ];

  const portPresets = [
    { label: "Common Ports", value: "21,22,23,25,53,80,110,143,443,465,587,993,995,3389,8080,8443" },
    { label: "Web Servers", value: "80,443,8080,8443,8888" },
    { label: "Database", value: "3306,5432,27017,6379" },
    { label: "Remote Access", value: "22,23,3389,5900" },
  ];

  return (
    <form className={cn("space-y-6")} onSubmit={handleSubmit(onSubmit)}>
      {/* Server Status Warning */}
      {disabled && (
        <Alert className="border-yellow-500/30 bg-yellow-950/20">
          <Server className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-300 text-sm">
            Scan server is offline. Real scans are disabled until server is available.
          </AlertDescription>
        </Alert>
      )}

      {/* Target Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-mono text-green-300 flex items-center gap-2">
            <Target className="h-4 w-4" />
            TARGET_SELECTION
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-green-400 hover:text-green-300"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={disabled}
          >
            {showAdvanced ? "HIDE_ADVANCED" : "SHOW_ADVANCED"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IP Inicial */}
          <div className="space-y-2">
            <Label htmlFor="startIP" className="text-gray-400 font-mono text-sm">TARGET_IP/DOMAIN *</Label>
            <Input
              id="startIP"
              placeholder="8.8.8.8 or example.com"
              {...register('startIP')}
              className={cn(
                "terminal-input",
                errors.startIP ? "border-red-500" : "border-green-500/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onChange={(e) => {
                setValue("startIP", e.target.value);
                setValue("endIP", e.target.value); // Auto-fill end IP
                trigger("startIP");
              }}
              disabled={disabled}
            />
            {errors.startIP ? (
              <p className="text-sm text-red-400 font-mono">{errors.startIP.message}</p>
            ) : (
              <p className="text-xs text-gray-500">Enter IP address or domain name</p>
            )}
          </div>

          {/* IP Final */}
          <div className="space-y-2">
            <Label htmlFor="endIP" className="text-gray-400 font-mono text-sm">END_IP (Optional)</Label>
            <Input
              id="endIP"
              placeholder="Same as target"
              {...register('endIP')}
              className={cn(
                "terminal-input",
                errors.endIP ? "border-red-500" : "border-green-500/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            />
            {errors.endIP && (
              <p className="text-sm text-red-400 font-mono">{errors.endIP.message}</p>
            )}
          </div>
        </div>

        {/* Quick Targets */}
        <div className="space-y-2">
          <Label className="text-gray-400 font-mono text-sm">QUICK_TARGETS</Label>
          <div className="flex flex-wrap gap-2">
            {commonTargets.map((target) => (
              <Button
                key={target.value}
                type="button"
                variant="outline"
                size="sm"
                className="border-green-900 text-green-400 hover:bg-green-950 font-mono text-xs"
                onClick={() => {
                  setValue("startIP", target.value);
                  setValue("endIP", target.value);
                  trigger("startIP");
                }}
                disabled={disabled}
              >
                <span className="flex items-center gap-1">
                  {target.icon}
                  {target.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Type */}
      <div className="space-y-2">
        <Label className="font-mono text-green-300 flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          SCAN_TYPE
        </Label>
        <Select value={scanType} onValueChange={(value: "stealth" | "aggressive" | "comprehensive" | "custom") => handleScanTypeChange(value)} disabled={disabled}>
          <SelectTrigger className={cn("terminal-input border-green-500/30", disabled && "opacity-50 cursor-not-allowed")}>
            <SelectValue placeholder="Select scan type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border border-green-500/30">
            <SelectItem value="stealth" className="font-mono hover:bg-green-950 focus:bg-green-950">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-green-400" />
                STEALTH (Slow, reliable)
              </div>
            </SelectItem>
            <SelectItem value="aggressive" className="font-mono hover:bg-red-950 focus:bg-red-950">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-red-400" />
                AGGRESSIVE (Fast, may timeout)
              </div>
            </SelectItem>
            <SelectItem value="comprehensive" className="font-mono hover:bg-blue-950 focus:bg-blue-950">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-blue-400" />
                COMPREHENSIVE (Full 1-1024 scan)
              </div>
            </SelectItem>
            <SelectItem value="custom" className="font-mono hover:bg-yellow-950 focus:bg-yellow-950">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-yellow-400" />
                CUSTOM (Manual configuration)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Configuración avanzada */}
      {(showAdvanced || scanType === "custom") && (
        <Card className="hacker-card border-green-500/30">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-green-300">ADVANCED_CONFIG</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-mono text-gray-400">COMMON_PORTS_ONLY</Label>
                <p className="text-xs text-gray-500">
                  Scan only frequently used ports
                </p>
              </div>
              <Switch
                checked={useCommonPorts}
                onCheckedChange={(checked) => {
                  setUseCommonPorts(checked);
                  setValue("portRange", checked 
                    ? "21,22,23,25,53,80,110,143,443,465,587,993,995,3389,8080,8443" 
                    : "1-1024");
                }}
                className="data-[state=checked]:bg-green-500"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portRange" className="font-mono text-gray-400">PORT_RANGE</Label>
              <Input
                id="portRange"
                placeholder={useCommonPorts ? "Common ports" : "1-1024"}
                {...register('portRange')}
                className={cn("terminal-input", disabled && "opacity-50 cursor-not-allowed")}
                disabled={disabled}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {portPresets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs border-gray-800 text-gray-400 hover:bg-gray-900"
                    onClick={() => {
                      setValue("portRange", preset.value);
                    }}
                    disabled={disabled}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 font-mono">
                Format: 80,443,8080 or 1-1000 (max 50 ports)
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="font-mono text-gray-400">TIMEOUT: {timeout}ms</Label>
                  <span className="text-xs text-gray-500">{timeout < 1000 ? "FAST" : timeout < 2000 ? "BALANCED" : "STEALTH"}</span>
                </div>
                <Slider
                  min={500}
                  max={5000}
                  step={100}
                  value={[timeout]}
                  onValueChange={([value]) => {
                    setTimeout(value);
                    setValue("timeout", value);
                  }}
                  className="[&>span]:bg-green-500"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="font-mono text-gray-400">CONCURRENT_CONNECTIONS: {maxConcurrent}</Label>
                  <span className="text-xs text-gray-500">{maxConcurrent < 3 ? "LOW" : maxConcurrent < 6 ? "MEDIUM" : "HIGH"}</span>
                </div>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[maxConcurrent]}
                  onValueChange={([value]) => {
                    setMaxConcurrent(value);
                    setValue("maxConcurrent", value);
                  }}
                  className="[&>span]:bg-green-500"
                  disabled={disabled}
                />
                <p className="text-xs text-gray-500">
                  Higher values are faster but may trigger firewalls
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas de validación */}
      {(errors.startIP || errors.endIP) && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-950/30">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300 font-mono">
            ERROR: Correct configuration errors before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {/* Real Scan Warning */}
      <Alert className="border-yellow-500/30 bg-yellow-950/20">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-300 text-sm">
          This performs REAL nmap scans. Only scan targets you own or have permission to test.
        </AlertDescription>
      </Alert>

      {/* Botón de escaneo */}
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full hacker-card border-green-500 hover:border-green-400 hover:scale-[1.02] transition-all"
          size="lg"
          disabled={isScanning || Object.keys(errors).length > 0 || disabled}
        >
          {isScanning ? (
            <>
              <Scan className="mr-2 h-5 w-5 animate-spin" />
              <span className="font-mono">REAL_SCANNING_IN_PROGRESS...</span>
            </>
          ) : (
            <>
              <Scan className="mr-2 h-5 w-5" />
              <span className="font-mono">INITIATE_REAL_NMAP_SCAN</span>
            </>
          )}
        </Button>
        <p className="text-center text-xs text-gray-500 mt-2 font-mono">
          {scanType === "stealth" ? "Estimated: 30-90 seconds" : 
           scanType === "aggressive" ? "Estimated: 15-45 seconds" : 
           scanType === "comprehensive" ? "Estimated: 2-5 minutes" : 
           "Time varies by configuration"}
        </p>
        {disabled && (
          <p className="text-center text-xs text-red-400 mt-2 font-mono">
            Scan server offline. Real scans disabled.
          </p>
        )}
      </div>
    </form>
  );
};