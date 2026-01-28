"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface DeviceInput {
  name: string;
  enterpriseId: string;
  ipAddress: string;
  deviceTypeId: string;
  login?: string | null;
  password?: string | null;
  connectedPort?: string | null;
  macAddress?: string | null;
  additionalInfo?: string | null;
  positionX?: number;
  positionY?: number;
}

export async function getDevices() {
  try {
    const result = await prisma.device.findMany({
      include: {
        enterprise: {
          include: {
            city: true,
          },
        },
        deviceType: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error fetching devices:", error);
    return { data: null, error: "Failed to fetch devices" };
  }
}

export async function createDevice(data: DeviceInput) {
  try {
    const result = await prisma.device.create({
      data: {
        name: data.name,
        enterpriseId: data.enterpriseId,
        ipAddress: data.ipAddress,
        deviceTypeId: data.deviceTypeId,
        login: data.login || null,
        password: data.password || null,
        connectedPort: data.connectedPort || null,
        macAddress: data.macAddress || null,
        additionalInfo: data.additionalInfo || null,
        positionX: data.positionX ?? 100,
        positionY: data.positionY ?? 100,
      },
      include: {
        enterprise: true,
        deviceType: true,
      },
    });
    revalidatePath("/dashboard/devices");
    revalidatePath("/dashboard/workspace");
    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error creating device:", error);
    return { data: null, error: "Failed to create device" };
  }
}

export async function updateDevice(id: string, data: Partial<DeviceInput>) {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.enterpriseId !== undefined)
      updateData.enterpriseId = data.enterpriseId;
    if (data.ipAddress !== undefined) updateData.ipAddress = data.ipAddress;
    if (data.deviceTypeId !== undefined)
      updateData.deviceTypeId = data.deviceTypeId;
    if (data.login !== undefined) updateData.login = data.login;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.connectedPort !== undefined)
      updateData.connectedPort = data.connectedPort;
    if (data.macAddress !== undefined) updateData.macAddress = data.macAddress;
    if (data.additionalInfo !== undefined)
      updateData.additionalInfo = data.additionalInfo;
    if (data.positionX !== undefined) updateData.positionX = data.positionX;
    if (data.positionY !== undefined) updateData.positionY = data.positionY;

    const result = await prisma.device.update({
      where: { id },
      data: updateData,
      include: {
        enterprise: true,
        deviceType: true,
      },
    });

    revalidatePath("/dashboard/devices");
    revalidatePath("/dashboard/workspace");
    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error updating device:", error);
    return { data: null, error: "Failed to update device" };
  }
}

export async function updateDevicePositions(
  updates: { id: string; positionX: number; positionY: number }[],
) {
  try {
    await Promise.all(
      updates.map((update) =>
        prisma.device.update({
          where: { id: update.id },
          data: {
            positionX: update.positionX,
            positionY: update.positionY,
          },
        }),
      ),
    );
    revalidatePath("/dashboard/workspace");
    return { error: null };
  } catch (error) {
    console.error("[Prisma] Error updating device positions:", error);
    return { error: "Failed to update positions" };
  }
}

export async function deleteDevice(id: string) {
  try {
    await prisma.device.delete({
      where: { id },
    });
    revalidatePath("/dashboard/devices");
    revalidatePath("/dashboard/workspace");
    return { error: null };
  } catch (error) {
    console.error("[Prisma] Error deleting device:", error);
    return { error: "Failed to delete device" };
  }
}
