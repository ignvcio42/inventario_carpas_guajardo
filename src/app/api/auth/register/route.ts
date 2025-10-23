import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validaciones básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El usuario ya existe" },
        { status: 400 }
      );
    }

    // Crear el usuario
    const user = await db.user.create({
      data: {
        name,
        email,
        password,
        role: Role.ADMIN, // Por defecto ADMIN para el primer usuario
        avatarUrl: "", // Se puede actualizar después
      },
    });

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "Usuario creado exitosamente", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}


