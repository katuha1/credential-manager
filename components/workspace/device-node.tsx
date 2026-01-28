"use client";

import React from "react";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Server,
  Router,
  Monitor,
  Shield,
  Wifi,
  Network,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  deviceType?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    bgColor?: string | null;
    textColor?: string | null;
  };
}

export interface DeviceNodeData {
  device: Device;
  label: string;
}

const deviceIcons: Record<string, React.ElementType> = {
  router: Router,
  switch: Network,
  server: Server,
  workstation: Monitor,
  firewall: Shield,
  access_point: Wifi,
  camera: Camera,
};

const defaultDeviceColors = {
  bg: "bg-slate-500/10",
  text: "text-slate-600",
  border: "border-slate-500/50",
};

function DeviceNodeComponent({
  data,
  selected,
}: {
  data: DeviceNodeData;
  selected: boolean;
}) {
  const device = data.device;
  const deviceTypeName =
    device.deviceType?.name?.toLowerCase().replace(/\s+/g, "_") || "server";
  const Icon = deviceIcons[deviceTypeName] || Server;

  // Используем цвета из БД или fallback значения
  const colors = {
    bg: device.deviceType?.bgColor || defaultDeviceColors.bg,
    text: device.deviceType?.textColor || defaultDeviceColors.text,
    border: "border-slate-500/50", // border будет один для всех
  };

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-card shadow-md min-w-35 transition-all",
        colors.border,
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !w-3 !h-3"
      />

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            colors.bg,
            colors.text,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm text-foreground">
            {device.name}
          </span>
          {device.ipAddress && (
            <span className="text-xs text-muted-foreground font-mono">
              {device.ipAddress}
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !w-3 !h-3"
      />
    </div>
  );
}

export const DeviceNode = memo(DeviceNodeComponent);
