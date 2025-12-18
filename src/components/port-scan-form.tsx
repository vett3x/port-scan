"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { z } from "zod";

const PortScanSchema = z.object({
  startIP: z.string().nonempty(),
  endIP: z.string().nonempty()
});

type PortScanFormValues = z.infer<typeof PortScanSchema>;

export const PortScanForm = () => {
  const { register, handleSubmit } = useForm<PortScanFormValues>({
    resolver: zodResolver(PortScanSchema)
  });

  const onSubmit = async (data: PortScanFormValues) => {
    // Placeholder for actual scanning logic
    console.log("Scanning ports from", data.startIP, "to", data.endIP);
  };

  return (
    <form className={cn("grid gap-4")} onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="startIP" className="block">
        Start IP
        <input id="startIP" {...register('startIP')} type="text" className="w-full rounded-md border p-2"/>
      </label>
      <label htmlFor="endIP" className="block">
        End IP
        <input id="endIP" {...register('endIP')} type="text" className="w-full rounded-md border p-2"/>
      </label>
      <button type="submit" className={cn("px-4 py-2 bg-primary text-white rounded")}>Scan</button>
    </form>
  );
};