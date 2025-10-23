import { NextResponse } from "next/server";

// Middleware temporalmente deshabilitado para evitar conflictos
export default function middleware() {
  return NextResponse.next();
}


