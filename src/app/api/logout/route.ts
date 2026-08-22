import { NextResponse } from "next/server";
import { signOutUser } from "@/lib/auth/core";

export async function POST() {
  await signOutUser();
  return NextResponse.json({ ok: true });
}
