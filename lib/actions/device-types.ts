"use server";

import prisma from "@/lib/prisma";

export interface DeviceTypeInput {
  name: string;
  icon?: string;
  color?: string;
  bgColor?: string;
  textColor?: string;
}

export async function getDeviceTypes() {
  try {
    const result = await prisma.deviceType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error fetching device types:", error);
    return { data: null, error: "Failed to fetch device types" };
  }
}

export async function createDeviceType(data: DeviceTypeInput) {
  try {
    const result = await prisma.deviceType.create({
      data: {
        name: data.name,
        icon: data.icon || null,
        color: data.color || null,
        bgColor: data.bgColor || null,
        textColor: data.textColor || null,
      },
    });

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error creating device type:", error);
    return { data: null, error: "Failed to create device type" };
  }
}

export async function updateDeviceType(
  id: string,
  data: Partial<DeviceTypeInput>,
) {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.bgColor !== undefined) updateData.bgColor = data.bgColor;
    if (data.textColor !== undefined) updateData.textColor = data.textColor;

    const result = await prisma.deviceType.update({
      where: { id },
      data: updateData,
    });

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error updating device type:", error);
    return { data: null, error: "Failed to update device type" };
  }
}

export async function deleteDeviceType(id: string) {
  try {
    // Check if any devices use this device type
    const deviceCount = await prisma.device.count({
      where: { deviceTypeId: id },
    });

    if (deviceCount > 0) {
      return {
        data: null,
        error: `Cannot delete device type: ${deviceCount} device(s) are using it`,
      };
    }

    const result = await prisma.deviceType.delete({
      where: { id },
    });

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error deleting device type:", error);
    return { data: null, error: "Failed to delete device type" };
  }
}
