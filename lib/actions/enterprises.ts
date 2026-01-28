"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEnterprises() {
  try {
    const enterprises = await prisma.enterprise.findMany({
      include: {
        city: true,
        _count: {
          select: { devices: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const result = enterprises.map((enterprise) => ({
      id: enterprise.id,
      name: enterprise.name,
      cityId: enterprise.cityId,
      createdAt: enterprise.createdAt,
      city: enterprise.city,
      deviceCount: enterprise._count.devices,
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error fetching enterprises:", error);
    return { data: null, error: "Failed to fetch enterprises" };
  }
}

export async function createEnterprise(data: { name: string; cityId: string }) {
  try {
    const result = await prisma.enterprise.create({
      data: {
        name: data.name,
        cityId: data.cityId,
      },
      include: {
        city: true,
      },
    });
    revalidatePath("/dashboard/enterprises");
    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error creating enterprise:", error);
    return { data: null, error: "Failed to create enterprise" };
  }
}

export async function updateEnterprise(
  id: string,
  data: { name: string; cityId: string },
) {
  try {
    const result = await prisma.enterprise.update({
      where: { id },
      data: {
        name: data.name,
        cityId: data.cityId,
      },
      include: {
        city: true,
      },
    });
    revalidatePath("/dashboard/enterprises");
    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error updating enterprise:", error);
    return { data: null, error: "Failed to update enterprise" };
  }
}

export async function deleteEnterprise(id: string) {
  try {
    await prisma.enterprise.delete({
      where: { id },
    });
    revalidatePath("/dashboard/enterprises");
    return { error: null };
  } catch (error) {
    console.error("[Prisma] Error deleting enterprise:", error);
    return { error: "Failed to delete enterprise" };
  }
}
