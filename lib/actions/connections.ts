"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getConnections() {
  try {
    const result = await prisma.networkConnection.findMany({
      select: {
        id: true,
        enterpriseId: true,
        sourceDeviceId: true,
        targetDeviceId: true,
        label: true,
        createdAt: true,
      },
    });

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error fetching connections:", error);
    return { data: null, error: "Failed to fetch connections" };
  }
}

export async function createConnection(data: {
  enterpriseId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  label?: string | null;
}) {
  try {
    const result = await prisma.networkConnection.create({
      data: {
        enterpriseId: data.enterpriseId,
        sourceDeviceId: data.sourceDeviceId,
        targetDeviceId: data.targetDeviceId,
        label: data.label || null,
      },
    });

    revalidatePath("/dashboard/workspace");
    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error creating connection:", error);
    return { data: null, error: "Failed to create connection" };
  }
}

export async function deleteConnection(id: string) {
  try {
    await prisma.networkConnection.delete({
      where: { id },
    });
    revalidatePath("/dashboard/workspace");
    return { error: null };
  } catch (error) {
    console.error("[Prisma] Error deleting connection:", error);
    return { error: "Failed to delete connection" };
  }
}
