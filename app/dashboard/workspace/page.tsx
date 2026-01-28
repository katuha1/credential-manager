"use client";

import React from "react";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DeviceNode,
  type DeviceNodeData,
} from "@/components/workspace/device-node";
import { getDevices, updateDevicePositions } from "@/lib/actions/devices";
import { getEnterprises } from "@/lib/actions/enterprises";
import {
  getConnections,
  createConnection,
  deleteConnection,
} from "@/lib/actions/connections";

interface City {
  id: string | null;
  name: string | null;
}

interface Enterprise {
  id: string | null;
  name: string | null;
  city: City | null;
}

interface Device {
  id: string;
  name: string;
  enterpriseId: string;
  ipAddress: string;
  deviceTypeId: string;
  positionX: number | null;
  positionY: number | null;
  deviceType?: {
    id: string;
    name: string;
  };
  enterprise: Enterprise | null;
}

interface NetworkConnection {
  id: string;
  enterpriseId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  label: string | null;
}

export default function WorkspacePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(
    null,
  );
  const [connectionLabel, setConnectionLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSavingPositions, setAutoSavingPositions] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const nodeTypes = useMemo(() => ({ device: DeviceNode }), []) as any;

  useEffect(() => {
    fetchData();
  }, []);

  // Set first enterprise as default when enterprises are loaded
  useEffect(() => {
    if (enterprises.length > 0 && !selectedEnterprise) {
      setSelectedEnterprise(enterprises[0].id || "");
    }
  }, [enterprises, selectedEnterprise]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (nodes.length === 0) return;

      try {
        setAutoSavingPositions(true);
        const updates = nodes.map((node) => ({
          id: node.id,
          positionX: Math.round(node.position.x),
          positionY: Math.round(node.position.y),
        }));

        const { error } = await updateDevicePositions(updates);
        if (error) throw new Error(error);

        setLastSavedTime(new Date());
      } catch (error) {
        console.error("[v0] Error auto-saving positions:", error);
      } finally {
        setAutoSavingPositions(false);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [nodes]);

  async function fetchData() {
    setLoading(true);
    const [devicesRes, enterprisesRes, connectionsRes] = await Promise.all([
      getDevices(),
      getEnterprises(),
      getConnections(),
    ]);

    if (devicesRes.error) {
      console.error("[v0] Error fetching devices:", devicesRes.error);
    } else {
      setDevices((devicesRes.data || []) as Device[]);
    }

    if (enterprisesRes.error) {
      console.error("[v0] Error fetching enterprises:", enterprisesRes.error);
    } else {
      setEnterprises((enterprisesRes.data || []) as Enterprise[]);
    }

    if (connectionsRes.error) {
      console.error("[v0] Error fetching connections:", connectionsRes.error);
    } else {
      setConnections((connectionsRes.data || []) as NetworkConnection[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    const filteredDevices = !selectedEnterprise
      ? devices
      : devices.filter((d) => d.enterpriseId === selectedEnterprise);

    const newNodes = filteredDevices.map((device) => ({
      id: device.id,
      type: "device",
      position: { x: device.positionX ?? 100, y: device.positionY ?? 100 },
      data: { device, label: device.name },
    }));

    const deviceIds = new Set(filteredDevices.map((d) => d.id));
    const newEdges: Edge[] = connections
      .filter(
        (c) =>
          deviceIds.has(c.sourceDeviceId) && deviceIds.has(c.targetDeviceId),
      )
      .map((conn) => ({
        id: conn.id,
        source: conn.sourceDeviceId,
        target: conn.targetDeviceId,
        type: "smoothstep",
        style: {
          stroke: "#3b82f6",
          strokeWidth: 2,
        },
        label: conn.label || undefined,
      }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [devices, connections, selectedEnterprise, setNodes, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection);
    setConnectionLabel("");
    setConnectionDialogOpen(true);
  }, []);

  async function handleCreateConnection() {
    if (!pendingConnection?.source || !pendingConnection?.target) return;

    const sourceDevice = devices.find((d) => d.id === pendingConnection.source);
    if (!sourceDevice) return;

    setSaving(true);
    try {
      const { data, error } = await createConnection({
        enterpriseId: sourceDevice.enterpriseId,
        sourceDeviceId: pendingConnection.source,
        targetDeviceId: pendingConnection.target,
        label: connectionLabel || null,
      });

      if (error) throw new Error(error);

      if (data) {
        setConnections((prev) => [...prev, data as NetworkConnection]);
      }
      setConnectionDialogOpen(false);
      setPendingConnection(null);
    } catch (error) {
      console.error("[v0] Error creating connection:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConnection(edgeId: string) {
    try {
      const { error } = await deleteConnection(edgeId);
      if (error) throw new Error(error);

      setConnections((prev) => prev.filter((c) => c.id !== edgeId));
    } catch (error) {
      console.error("[v0] Error deleting connection:", error);
    }
  }

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (window.confirm("Удалить это соединение?")) {
      handleDeleteConnection(edge.id);
    }
  }, []);

  async function savePositions() {
    setSaving(true);
    try {
      const updates = nodes.map((node) => ({
        id: node.id,
        positionX: Math.round(node.position.x),
        positionY: Math.round(node.position.y),
      }));

      const { error } = await updateDevicePositions(updates);
      if (error) throw new Error(error);

      setDevices((prev) =>
        prev.map((d) => {
          const update = updates.find((u) => u.id === d.id);
          return update
            ? { ...d, positionX: update.positionX, positionY: update.positionY }
            : d;
        }),
      );

      setLastSavedTime(new Date());
    } catch (error) {
      console.error("[v0] Error saving positions:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Загрузка сети...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Визуализация сети
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedEnterprise}
            onValueChange={setSelectedEnterprise}
          >
            <SelectTrigger className="w-62.5">
              <SelectValue placeholder="Фильтр по предприятию" />
            </SelectTrigger>
            <SelectContent>
              {enterprises.map((ent) =>
                ent.id ? (
                  <SelectItem key={ent.id} value={ent.id}>
                    {ent.name} ({ent.city?.name})
                  </SelectItem>
                ) : null,
              )}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            {autoSavingPositions ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Автосохранение...
              </div>
            ) : lastSavedTime ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Сохранено {lastSavedTime.toLocaleTimeString()}
              </div>
            ) : null}
            <Button
              onClick={savePositions}
              disabled={saving}
              variant="outline"
              size="sm"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Нет доступных устройств.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="h-full border rounded-lg overflow-hidden bg-muted/30">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            snapToGrid
            snapGrid={[20, 20]}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            {/* <MiniMap maskColor="rgba(0,0,0,0.1)" /> */}
          </ReactFlow>
        </div>
      )}

      <Dialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать соединение</DialogTitle>
            <DialogDescription>
              Добавьте метку для соединения между устройствами (например, номер
              порта)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Метка соединения (опционально)</Label>
              <Input
                value={connectionLabel}
                onChange={(e) => setConnectionLabel(e.target.value)}
                placeholder="Например: Port 28"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectionDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateConnection} disabled={saving}>
              {saving ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
