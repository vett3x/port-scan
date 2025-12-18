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
import { AlertCircle, Scan, Target, Cpu, Shield } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";

// Esquema de validación con Zod
const PortScanSchema = z.object({
  startIP: z.string()
    .min(1, "IP address required")
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP format (e.g., 8.8.8.8)"),
  endIP: z.string()
    .min(1, "IP address required")
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP format (e.g., 8.8.8.10)"),
  portRange: z.string().optional(),
  scanType: z.enum(["stealth", "aggressive", "comprehensive", "custom"]),
  timeout: z.number().min(100).max(10000),
  maxConcurrent: z.number().min(1).max(200),
});

type PortScanFormValues = z.infer<typeof PortScanSchema>;

interface PortScanFormProps {
  onScanStart: (startIP: string, endIP: string) => void;
  isScanning: boolean;
}

export const PortScanForm = ({ onScanStart, isScanning }: PortScanFormProps) => {
  const [scanType, setScanType] = useState<"stealth" | "aggressive" | "comprehensive" | "custom">("stealth");
  const [useCommonPorts, setUseCommonPorts] = useState(true);
  const [timeout, setTimeout] = useState(1000);
  const [maxConcurrent, setMaxConcurrent] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PortScanFormValues>({
    resolver: zodResolver(PortScanSchema),
    defaultValues: {
      startIP: "8.8.8.8",
      endIP: "8.8.8.8",
      portRange: useCommonPorts ? "21,22,23,25,53,80,110,143,443,465,587,993,995,3389,8080,8443" : "1-1024",
      scanType: "stealth",
      timeout: 1000,
      maxConcurrent: 50,
    }
  });

  const onSubmit = (data: PortScanFormValues) => {
    console.log("[FORM_SUBMIT] Scan configuration:", data);
    onScanStart(data.startIP, data.endIP);
  };

  const handleScanTypeChange = (value: "stealth" | "aggressive" | "comprehensive" | "custom") => {
    setScanType(value);
    setValue("scanType", value);
    
    // Ajustar configuración según el tipo de escaneo
    switch (value) {
      case "stealth":
        setUseCommonPorts(true);
        setTimeout(1500);
        setMaxConcurrent(10);
        setValue("timeout", 1500);
        setValue("maxConcurrent", 10);
        break;
      case "aggressive":
        setUseCommonPorts(true);
        setTimeout(500);
        setMaxConcurrent(100);
        setValue("timeout", 500);
        setValue("maxConcurrent", 100);
        break;
      case "comprehensive":
        setUseCommonPorts(false);
        setTimeout(3000);
        setMaxConcurrent(20);
        setValue("timeout", 3000);
        setValue("maxConcurrent", 20);
        break;
      case "custom":
        setShowAdvanced(true);
        break;
    }
  };

  const commonTargets = [
    { label: "Google DNS", value: "8.8.8.8" },
    { label: "Cloudflare", value: "1.1.1.1" },
    { label: "Local Network", value: "192.168.1.1" },
  ];

  return (
    <form className={cn("space-y-6")} onSubmit={handleSubmit(onSubmit)}>
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
          >
            {showAdvanced ? "HIDE_ADVANCED" : "SHOW_ADVANCED"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IP Inicial */}
          <div className="space-y-2">
            <Label htmlFor="startIP" className="text-gray-400 font-mono text-sm">START_IP *</Label>
            <Input
              id="startIP"
              placeholder="8.8.8.8"
              {...register('startIP')}
              className={cn(
                "terminal-input",
                errors.startIP ? "border-red-500" : "border-green-500/30"
              )}
            />
            {errors.startIP && (
              <p className="text-sm text-red-400 font-mono">{errors.startIP.message}</p>
            )}
          </div>

          {/* IP Final */}
          <div className="space-y-2">
            <Label htmlFor="endIP" className="text-gray-400 font-mono text-sm">END_IP *</Label>
            <Input
              id="endIP"
              placeholder="8.8.8.10"
              {...register('endIP')}
              className={cn(
                "terminal-input",
                errors.endIP ? "border-red-500" : "border-green-500/30"
              )}
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
                }}
              >
                {target.label}
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
        <Select value={scanType} onValueChange={(value: "stealth" | "aggressive" | "comprehensive" | "custom") => handleScanTypeChange(value)}>
          <SelectTrigger className="terminal-input border-green-500/30">
            <SelectValue placeholder="Select scan type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border border-green-500/30">
            <SelectItem value="stealth" className="font-mono hover:bg-green-950 focus:bg-green-950">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-green-400" />
                STEALTH (Slow, undetectable)
              </div>
            </SelectItem>
            <SelectItem value="aggressive" className="font-mono hover:bg-red-950 focus:bg-red-950">
              <div className="flex items-center gap-2">
                <Scan className="h-3 w-3 text-red-400" />
                AGGRESSIVE (Fast, may trigger alarms)
              </div>
            </SelectItem>
            <SelectItem value="comprehensive" className="font-mono hover:bg-blue-950 focus:bg-blue-950">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-blue-400" />
                COMPREHENSIVE (Full analysis)
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portRange" className="font-mono text-gray-400">PORT_RANGE</Label>
              <Input
                id="portRange"
                placeholder={useCommonPorts ? "Common ports" : "1-1024"}
                {...register('portRange')}
                disabled={!useCommonPorts}
                className="terminal-input"
              />
              <p className="text-xs text-gray-500 font-mono">
                Format: 80,443,8080 or 1-1000
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="font-mono text-gray-400">TIMEOUT: {timeout}ms</Label>
                  <span className="text-xs text-gray-500">{timeout < 1000 ? "FAST" : timeout < 3000 ? "BALANCED" : "STEALTH"}</span>
                </div>
                <Slider
                  min={100}
                  max={5000}
                  step={100}
                  value={[timeout]}
                  onValueChange={([value]) => {
                    setTimeout(value);
                    setValue("timeout", value);
                  }}
                  className="[&>span]:bg-green-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="font-mono text-gray-400">CONCURRENT_CONNECTIONS: {maxConcurrent}</Label>
                  <span className="text-xs text-gray-500">{maxConcurrent < 20 ? "LOW" : maxConcurrent < 80 ? "MEDIUM" : "HIGH"}</span>
                </div>
                <Slider
                  min={1}
                  max={200}
                  step={1}
                  value={[maxConcurrent]}
                  onValueChange={([value]) => {
                    setMaxConcurrent(value);
                    setValue("maxConcurrent", value);
                  }}
                  className="[&>span]:bg-green-500"
                />
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

      {/* Botón de escaneo */}
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full hacker-card border-green-500 hover:border-green-400 hover:scale-[1.02] transition-all"
          size="lg"
          disabled={isScanning || Object.keys(errors).length > 0}
        >
          {isScanning ? (
            <>
              <Scan className="mr-2 h-5 w-5 animate-spin" />
              <span className="font-mono">SCANNING_IN_PROGRESS...</span>
            </>
          ) : (
            <>
              <Scan className="mr-2 h-5 w-5" />
              <span className="font-mono">INITIATE_SCAN</span>
            </>
          )}
        </Button>
        <p className="text-center text-xs text-gray-500 mt-2 font-mono">
          Estimated time: {scanType === "stealth" ? "2-5min" : scanType === "aggressive" ? "30-60s" : "5-10min"}
        </p>
      </div>
    </form>
  );
};