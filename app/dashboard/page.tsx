"use client";

import React from "react";

import { useEffect, useState } from "react";
import {
  MapPin,
  Building2,
  Server,
  Router,
  MonitorDot,
  Camera,
  Wifi,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/actions/stats";
import { getDeviceTypes } from "@/lib/actions/device-types";

interface Stats {
  cities: number;
  enterprises: number;
  devices: number;
  deviceTypes: Record<string, number>;
}

interface DeviceType {
  id: string;
  name: string;
  icon?: string | null;
}

const defaultDeviceTypeIcons: Record<string, React.ElementType> = {
  router: Router,
  switch: MonitorDot,
  server: Server,
  camera: Camera,
  access_point: Wifi,
  firewall: Shield,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResult, typesResult] = await Promise.all([
          getDashboardStats(),
          getDeviceTypes(),
        ]);

        if (statsResult.error) {
          console.error("[Dashboard] Error fetching stats:", statsResult.error);
        } else if (statsResult.data) {
          setStats(statsResult.data);
        }

        if (typesResult.error) {
          console.error(
            "[Dashboard] Error fetching device types:",
            typesResult.error,
          );
        } else if (typesResult.data) {
          setDeviceTypes(typesResult.data);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getIconForDeviceType = (typeName: string): React.ElementType => {
    const lowerName = typeName.toLowerCase().replace(/\s+/g, "_");
    return defaultDeviceTypeIcons[lowerName] || Server;
  };

  const mainCards = [
    {
      title: "Города",
      value: stats?.cities ?? 0,
      icon: MapPin,
      description: "Всего городов в системе",
    },
    {
      title: "Предприятия",
      value: stats?.enterprises ?? 0,
      icon: Building2,
      description: "Всего предприятий",
    },
    {
      title: "Устройства",
      value: stats?.devices ?? 0,
      icon: Server,
      description: "Всего устройств",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Загрузка статистики...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Обзор системы</h1>
        <p className="text-muted-foreground">
          Общая статистика по инфраструктуре
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {mainCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats?.deviceTypes && Object.keys(stats.deviceTypes).length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-8">По типам устройств</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.deviceTypes).map(([type, count]) => {
              const Icon = getIconForDeviceType(type);
              return (
                <Card key={type}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {type}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
