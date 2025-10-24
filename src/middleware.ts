import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Si es la página raíz, permitir que se maneje en el componente
  if (pathname === "/") {
    return NextResponse.next();
  }
  
  // Para todas las demás rutas, continuar normalmente
  return NextResponse.next();
}


