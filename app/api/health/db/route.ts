import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const countryCount = await prisma.country.count();
    return NextResponse.json({ status: "ok", countryCount });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
