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
import { AlertCircle, Scan } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Esquema de validación con Zod
const PortScanSchema = z.object({
  startIP: z.string()
    .min(1, "La IP inicial es requerida")
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Formato de IP inválido (ej: 192.168.1.1)"),
  endIP: z.string()
    .min(1, "La IP final es requerida")
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Formato de IP inválido (ej: 192.168.1.100)"),
  portRange: z.string().optional(),
  scanType: z.enum(["quick", "full", "custom"]),
  timeout: z.number().min(100).max(10000),
  maxConcurrent: z.number().min(1).max(100),
});

type PortScanFormValues = z.infer<typeof PortScanSchema>;

interface PortScanFormProps {
  onScanStart: (startIP: string, endIP: string) => void;
  isScanning: boolean;
}

export const PortScanForm = ({ onScanStart, isScanning }: PortScanFormProps) => {
  const [scanType, setScanType] = useState<"quick" | "full" | "custom">("quick");
  const [useCommonPorts, setUseCommonPorts] = useState(true);
  const [timeout, setTimeout] = useState(1000);
  const [maxConcurrent, setMaxConcurrent] = useState(10);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PortScanFormValues>({
    resolver: zodResolver(PortScanSchema),
    defaultValues: {
      startIP: "192.168.1.1",
      endIP: "192.168.1.10",
      portRange: useCommonPorts ? "21,22,23,25,53,80,110,143,443,465,587,993,995,3389" : "1-1024",
      scanType: "quick",
      timeout: 1000,
      maxConcurrent: 10,
    }
  });

  const onSubmit = (data: PortScanFormValues) => {
    console.log("Datos del escaneo:", data);
    onScanStart(data.startIP, data.endIP);
  };

  const handleScanTypeChange = (value: "quick" | "full" | "custom") => {
    setScanType(value);
    setValue("scanType", value);
    
    // Ajustar configuración según el tipo de escaneo
    switch (value) {
      case "quick":
        setUseCommonPorts(true);
        setTimeout(500);
        setMaxConcurrent(20);
        setValue("timeout", 500);
        setValue("maxConcurrent", 20);
        break;
      case "full":
        setUseCommonPorts(false);
        setTimeout(2000);
        setMaxConcurrent(5);
        setValue("timeout", 2000);
        setValue("maxConcurrent", 5);
        break;
      case "custom":
        // Mantener valores actuales
        break;
    }
  };

  return (
    <form className={cn("space-y-6")} onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IP Inicial */}
        <div className="space-y-2">
          <Label htmlFor="startIP">IP Inicial *</Label>
          <Input
            id="startIP"
            placeholder="192.168.1.1"
            {...register('startIP')}
            className={errors.startIP ? "border-destructive" : ""}
          />
          {errors.startIP && (
            <p className="text-sm text-destructive">{errors.startIP.message}</p>
          )}
        </div>

        {/* IP Final */}
        <div className="space-y-2">
          <Label htmlFor="endIP">IP Final *</Label>
          <Input
            id="endIP"
            placeholder="192.168.1.100"
            {...register('endIP')}
            className={errors.endIP ? "border-destructive" : ""}
          />
          {errors.endIP && (
            <p className="text-sm text-destructive">{errors.endIP.message}</p>
          )}
        </div>
      </div>

      {/* Tipo de Escaneo */}
      <div className="space-y-2">
        <Label>Tipo de Escaneo</Label>
        <Select value={scanType} onValueChange={(value: "quick" | "full" | "custom") => handleScanTypeChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo de escaneo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quick">Escaneo Rápido (puertos comunes)</SelectItem>
            <SelectItem value="full">Escaneo Completo (todos los puertos)</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Configuración avanzada */}
      {scanType === "custom" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuración Avanzada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Puertos Comunes</Label>
                <p className="text-sm text-muted-foreground">
                  Escanear solo los puertos más utilizados
                </p>
              </div>
              <Switch
                checked={useCommonPorts}
                onCheckedChange={(checked) => {
                  setUseCommonPorts(checked);
                  setValue("portRange", checked 
                    ? "21,22,23,25,53,80,110,143,443,465,587,993,995,3389" 
                    : "1-1024");
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portRange">Rango de Puertos</Label>
              <Input
                id="portRange"
                placeholder={useCommonPorts ? "Puertos comunes" : "1-1024"}
                {...register('portRange')}
                disabled={!useCommonPorts}
              />
              <p className="text-xs text-muted-foreground">
                Formato: 80,443,8080 o 1-1000
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={timeout}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setTimeout(value);
                    setValue("timeout", value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxConcurrent">Máx. Conexiones</Label>
                <Input
                  id="maxConcurrent"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={maxConcurrent}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setMaxConcurrent(value);
                    setValue("maxConcurrent", value);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas de validación */}
      {(errors.startIP || errors.endIP) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Por favor, corrige los errores en el formulario antes de continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* Botón de escaneo */}
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={isScanning || Object.keys(errors).length > 0}
        >
          {isScanning ? (
            <>
              <Scan className="mr-2 h-4 w-4 animate-spin" />
              Escaneando...
            </>
          ) : (
            <>
              <Scan className="mr-2 h-4 w-4" />
              Iniciar Escaneo
            </>
          )}
        </Button>
      </div>
    </form>
  );
};