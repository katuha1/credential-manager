"use server";

import prisma from "@/lib/prisma";

export async function getUsers() {
  try {
    const result = await prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error fetching users:", error);
    return { data: null, error: "Failed to fetch users" };
  }
}

export async function verifyPin(userId: string, pinCode: string) {
  try {
    const result = await prisma.user.findFirst({
      where: {
        id: userId,
        pinCode: pinCode,
      },
    });

    if (!result) {
      return { data: null, error: "Invalid PIN code" };
    }

    return { data: result, error: null };
  } catch (error) {
    console.error("[Prisma] Error verifying PIN:", error);
    return { data: null, error: "Authentication failed" };
  }
}
