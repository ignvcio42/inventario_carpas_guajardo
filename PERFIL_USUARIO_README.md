# Configuración de Perfil de Usuario - Carpas Guajardo

## Descripción

El apartado de perfil de usuario permite a cada usuario gestionar su información personal, preferencias y configuraciones básicas. Todos los usuarios autenticados pueden acceder a su propio perfil.

## Características

### 👤 Información Personal
- **Nombre completo**: Nombre del usuario
- **Teléfono**: Número de contacto personal
- **Dirección**: Dirección física del usuario
- **Biografía**: Descripción personal opcional
- **Avatar**: Foto de perfil (usando imagen de Google/NextAuth)

### 🌍 Configuración Regional
- **Zona horaria**: Configuración de zona horaria (por defecto: America/Santiago)
- **Idioma**: Idioma preferido (por defecto: español)

### 📊 Estadísticas Personales
- **Total de eventos**: Número total de eventos creados
- **Eventos completados**: Eventos finalizados exitosamente
- **Eventos pendientes**: Eventos en estado pendiente
- **Bocetos creados**: Número de bocetos de carpas creados
- **Progreso**: Barra de progreso de eventos completados

### 🔔 Preferencias de Notificaciones
- **Notificaciones por email**: Recibir notificaciones por correo
- **Notificaciones push**: Recibir notificaciones en el navegador
- **Recordatorios de eventos**: Notificaciones de eventos próximos
- **Resumen diario**: Resumen diario de actividades
- **Reporte semanal**: Reporte semanal de actividades

### 📈 Actividad Reciente
- **Timeline de eventos**: Últimos eventos creados
- **Timeline de bocetos**: Últimos bocetos creados
- **Fechas de creación**: Información temporal de actividades

## Estructura de Datos

### Campos del Usuario (Prisma Schema)
```prisma
model User {
  id            String      @id @default(cuid())
  name          String?
  email         String?     @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role        @default(WORKER)
  avatarUrl     String      @default("")
  phone         String?     // Nuevo
  address       String?     // Nuevo
  bio           String?     // Nuevo
  preferences   Json?       @default("{}") // Nuevo
  timezone      String?     @default("America/Santiago") // Nuevo
  language      String?     @default("es") // Nuevo
  createdAt     DateTime    @default(now()) // Nuevo
  updatedAt     DateTime    @updatedAt // Nuevo
  // ... otras relaciones
}
```

### Estructura de Preferencias (JSON)
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "event_reminders": true,
  "daily_summary": false,
  "weekly_report": true
}
```

## Uso

### Acceso al Perfil
1. Inicia sesión en la aplicación
2. Haz clic en "Mi Perfil" en el menú lateral
3. Explora las diferentes pestañas disponibles

### Editar Información Personal
1. Haz clic en "Editar Perfil"
2. Completa los campos que desees actualizar:
   - Nombre completo (requerido)
   - Teléfono
   - Dirección
   - Biografía
   - Zona horaria
   - Idioma
3. Haz clic en "Guardar Cambios"

### Configurar Preferencias de Notificaciones
1. Ve a la pestaña "Preferencias"
2. Activa/desactiva las notificaciones según tus preferencias
3. Los cambios se guardan automáticamente

### Ver Estadísticas
1. Ve a la pestaña "Estadísticas"
2. Revisa tus métricas personales:
   - Total de eventos creados
   - Eventos completados vs pendientes
   - Bocetos creados
   - Progreso general

### Revisar Actividad Reciente
1. Ve a la pestaña "Actividad"
2. Revisa tu timeline de actividades recientes
3. Ve los últimos eventos y bocetos creados

## API Endpoints

### Obtener perfil actual
```typescript
api.profile.getCurrentProfile.useQuery()
```

### Actualizar perfil
```typescript
api.profile.updateProfile.useMutation({
  name: "Juan Pérez",
  phone: "+56 9 1234 5678",
  address: "Av. Principal 123",
  bio: "Técnico especializado en carpas",
  timezone: "America/Santiago",
  language: "es"
})
```

### Actualizar avatar
```typescript
api.profile.updateAvatar.useMutation({
  avatarUrl: "https://example.com/avatar.jpg"
})
```

### Obtener estadísticas
```typescript
api.profile.getUserStats.useQuery()
```

### Obtener actividad reciente
```typescript
api.profile.getRecentActivity.useQuery({ limit: 10 })
```

### Obtener preferencias disponibles
```typescript
api.profile.getAvailablePreferences.useQuery()
```

### Actualizar preferencias
```typescript
api.profile.updatePreferences.useMutation({
  preferences: {
    email_notifications: true,
    push_notifications: false,
    event_reminders: true
  }
})
```

## Zonas Horarias Soportadas

- **America/Santiago**: Santiago (Chile) - Por defecto
- **America/New_York**: Nueva York (EE.UU.)
- **America/Los_Angeles**: Los Ángeles (EE.UU.)
- **Europe/Madrid**: Madrid (España)
- **Europe/London**: Londres (Reino Unido)
- **Asia/Tokyo**: Tokio (Japón)

## Idiomas Soportados

- **es**: Español - Por defecto
- **en**: English
- **pt**: Português

## Roles de Usuario

Los usuarios pueden tener diferentes roles que se muestran con colores distintivos:

- **SUPER_ADMIN** (Rojo): Super Administrador
- **ADMIN** (Naranja): Administrador
- **MANAGER** (Azul): Gerente
- **TECHNICIAN** (Verde): Técnico
- **SALES** (Púrpura): Ventas
- **WORKER** (Gris): Trabajador

## Seguridad

- Solo el usuario propietario puede editar su propio perfil
- Las preferencias se almacenan como JSON encriptado
- Todas las actualizaciones quedan registradas con timestamp
- Los datos sensibles como contraseñas no se exponen en el perfil

## Notas Importantes

- El nombre es el único campo requerido para actualizar el perfil
- Los cambios en preferencias se guardan automáticamente
- El avatar se sincroniza con la imagen de Google/NextAuth si está disponible
- Las estadísticas se actualizan en tiempo real
- La actividad reciente muestra los últimos 10 elementos por defecto
