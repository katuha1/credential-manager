"use server";

import prisma from "@/lib/prisma";

export async function getDashboardStats() {
  try {
    const [citiesCount, enterprisesCount, devicesRaw, deviceTypes] =
      await Promise.all([
        prisma.city.count(),
        prisma.enterprise.count(),
        prisma.device.findMany({
          select: { deviceTypeId: true },
        }),
        prisma.deviceType.findMany({
          select: { id: true, name: true },
        }),
      ]);

    const deviceTypeMap = new Map(deviceTypes.map((dt) => [dt.id, dt.name]));
    const deviceTypeCount: Record<string, number> = {};

    for (const device of devicesRaw) {
      const typeName = deviceTypeMap.get(device.deviceTypeId) || "Unknown";
      deviceTypeCount[typeName] = (deviceTypeCount[typeName] || 0) + 1;
    }

    return {
      data: {
        cities: citiesCount,
        enterprises: enterprisesCount,
        devices: devicesRaw.length,
        deviceTypes: deviceTypeCount,
      },
      error: null,
    };
  } catch (error) {
    console.error("[Prisma] Error fetching stats:", error);
    return { data: null, error: "Failed to fetch stats" };
  }
}
