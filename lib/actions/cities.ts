"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCities() {
  try {
    const cities = await prisma.city.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: { enterprises: true },
        },
      },
    });

    const result = cities.map((city) => ({
      id: city.id,
      name: city.name,
      createdAt: city.createdAt,
      enterpriseCount: city._count.enterprises,
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error fetching cities:", error);
    return { data: null, error: "Failed to fetch cities" };
  }
}

export async function createCity(name: string) {
  try {
    const result = await prisma.city.create({
      data: { name },
    });
    revalidatePath("/dashboard/enterprises");
    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error creating city:", error);
    return { data: null, error: "Failed to create city" };
  }
}

export async function updateCity(id: string, name: string) {
  try {
    const result = await prisma.city.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/dashboard/enterprises");
    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error updating city:", error);
    return { data: null, error: "Failed to update city" };
  }
}

export async function deleteCity(id: string) {
  try {
    await prisma.city.delete({
      where: { id },
    });
    revalidatePath("/dashboard/enterprises");
    return { error: null };
  } catch (error) {
    console.error("[Prisma] Error deleting city:", error);
    return { error: "Failed to delete city" };
  }
}
