# Sistema de Inventario de Carpas Guajardo

Sistema web para gestión de inventario de carpas y eventos desarrollado con T3 Stack (Next.js + tRPC + Prisma + Tailwind + NextAuth).

## 🚀 Características

- **Autenticación completa** con NextAuth.js
- **Gestión de usuarios** con roles y permisos
- **Dashboard interactivo** con métricas y estadísticas
- **Sidenav responsivo** con navegación intuitiva
- **Base de datos PostgreSQL** con Prisma ORM
- **Sesiones persistentes** y seguras
- **Interfaz moderna** con Tailwind CSS

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **tRPC** - API type-safe
- **Prisma** - ORM para base de datos
- **NextAuth.js** - Autenticación
- **Tailwind CSS** - Estilos
- **PostgreSQL** - Base de datos

## 📋 Prerrequisitos

- Node.js 18+ 
- PostgreSQL 13+
- npm o yarn

## ⚙️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd inventario_carpas_guajardo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crea un archivo `.env` basado en `.env.example`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/inventario_carpas"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. **Configurar la base de datos**
```bash
# Generar el cliente Prisma
npx prisma generate

# Crear y ejecutar migraciones
npx prisma migrate dev --name init

# (Opcional) Abrir Prisma Studio
npx prisma studio
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🔐 Autenticación

### Providers configurados:
- **Credenciales** - Email/contraseña
- **Google OAuth** - Login con Google

### Roles disponibles:
- `SUPER_ADMIN` - Acceso total
- `ADMIN` - Gestión completa
- `MANAGER` - Supervisión
- `TECHNICIAN` - Visitas técnicas
- `SALES` - Ventas
- `WORKER` - Solo lectura

## 📱 Uso

1. **Primer acceso**: Ve a `/auth/signup` para crear tu cuenta
2. **Login**: Usa `/auth/signin` para iniciar sesión
3. **Dashboard**: Accede a `/dashboard` para ver el panel principal
4. **Navegación**: Usa el sidenav para acceder a todas las funcionalidades

## 🗂️ Estructura del proyecto

```
src/
├── app/
│   ├── _components/     # Componentes reutilizables
│   ├── api/            # API routes
│   ├── auth/           # Páginas de autenticación
│   ├── dashboard/      # Dashboard principal
│   └── layout.tsx      # Layout raíz
├── server/
│   ├── api/            # tRPC routers
│   ├── auth.ts         # Configuración NextAuth
│   └── db.ts           # Cliente Prisma
├── trpc/               # Configuración tRPC
└── middleware.ts       # Middleware de autenticación
```

## 🚀 Despliegue

### Variables de entorno para producción:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://your-domain.com"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Comandos de despliegue:
```bash
# Build para producción
npm run build

# Migrar base de datos
npx prisma migrate deploy

# Iniciar servidor
npm start
```

## 🔧 Comandos útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Linting
npm run lint

# Base de datos
npm run db:generate    # Generar cliente Prisma
npm run db:migrate     # Ejecutar migraciones
npm run db:push        # Push schema a DB
npm run db:studio      # Abrir Prisma Studio
```

## 📊 Funcionalidades principales

- ✅ **Autenticación completa** con múltiples providers
- ✅ **Dashboard con métricas** y estadísticas
- ✅ **Sidenav responsivo** con navegación
- ✅ **Gestión de sesiones** persistentes
- ✅ **Protección de rutas** con middleware
- ✅ **Roles y permisos** escalables
- 🔄 **Gestión de eventos** (en desarrollo)
- 🔄 **Control de inventario** (en desarrollo)
- 🔄 **Visitas técnicas** (en desarrollo)

## 🐛 Solución de problemas

### Error de permisos en Windows:
```bash
# Ejecutar como administrador o usar:
npx prisma generate --force
```

### Error de conexión a DB:
- Verificar que PostgreSQL esté ejecutándose
- Revisar la URL de conexión en `.env`
- Asegurar que la base de datos existe

### Error de autenticación:
- Verificar `NEXTAUTH_SECRET` en `.env`
- Revisar configuración de OAuth providers
- Comprobar URLs de callback

## 📝 Licencia

Este proyecto es privado y confidencial.

## 👥 Soporte

Para soporte técnico, contactar al equipo de desarrollo.