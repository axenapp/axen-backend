# Axen Backend

API REST de la plataforma Axen. Gestiona autenticación, negocios, servicios, slots, reservas, pagos y notificaciones.

## Stack

| | |
|---|---|
| **Framework** | NestJS 11 + TypeScript |
| **Base de datos** | PostgreSQL 15 (Docker) |
| **ORM** | TypeORM 0.3 |
| **Autenticación** | JWT + Passport + bcrypt (factor 12) |
| **Pagos** | MercadoPago SDK v2 (sandbox) |
| **Emails** | Nodemailer / Resend *(ver nota de entorno)* |
| **Tareas programadas** | @nestjs/schedule + @Cron |
| **Validación** | class-validator + class-transformer |

## Requisitos

- Node.js v18 o superior
- npm v9 o superior
- Docker Desktop corriendo

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/axenapp/axen-backend.git
cd axen-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear el archivo .env con los valores de la sección siguiente

# 4. Levantar PostgreSQL con Docker
docker compose up -d

# 5. Cargar datos de prueba
npm run seed

# 6. Levantar el servidor de desarrollo
npm run start:dev
```

La API corre en `http://localhost:3000/api/v1`

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=axen_db

# JWT
JWT_SECRET=cambiar_por_secreto_seguro

# Entorno
NODE_ENV=development

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5174

# MercadoPago (sandbox — obtener en mercadopago.com.ar/developers)
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxx
MP_WEBHOOK_SECRET=
```

> `MP_WEBHOOK_SECRET` se puede dejar vacío en local — la verificación de firma se saltea automáticamente.

## Seed de datos de prueba

El comando `npm run seed` carga en la base de datos:

- Usuario partner: `partner@axen.demo` / `Demo1234`
- Negocio: *Peluquería Axen Demo* (activo)
- 2 servicios: Corte de cabello ($3.500) y Corte + Barba ($5.000)
- 112 slots para los próximos 7 días (9:00 a 17:00)

Puede correrse múltiples veces — limpia los datos previos antes de insertar.

## Estructura del proyecto

```
src/
├── modules/
│   ├── auth/          # Register, login, JWT strategy
│   ├── users/         # Entidad usuario
│   ├── partners/      # Negocios, geocoding, dashboard
│   ├── services/      # Servicios del negocio
│   ├── slots/         # Disponibilidad y agenda
│   ├── bookings/      # Reservas con SELECT FOR UPDATE
│   ├── payments/      # MercadoPago + webhook
│   ├── notifications/ # Emails + cron de recordatorios
│   └── reviews/       # Reseñas de usuarios
├── common/
│   ├── decorators/    # @CurrentUser, @Roles
│   ├── guards/        # JwtAuthGuard, RolesGuard
│   └── filters/       # HttpExceptionFilter global
├── app.module.ts
├── main.ts
└── seed.ts
```

## Progreso del desarrollo

### ✅ Completado

**Configuración base**
- NestJS con prefijo global `/api/v1`
- ValidationPipe global (whitelist, transform, forbidNonWhitelisted)
- TypeORM con `synchronize: true` en desarrollo y `false` en producción
- CORS configurado para panel web y app móvil
- Filtro global de excepciones con respuestas estandarizadas
- Script de seed con datos de demo

**Módulo Auth**
- `POST /auth/register` y `POST /auth/login`
- JWT firmado, bcrypt factor 12
- Bloqueo de cuenta tras 5 intentos fallidos (15 minutos)
- Guards de autenticación y roles (`user` / `partner`)

**Módulo Partners**
- CRUD completo de negocios
- Geocodificación de dirección (mock sin API key → coordenadas de Buenos Aires)
- Flujo `draft → active` vía endpoint `/activate`
- Endpoint `/dashboard` con métricas en paralelo (Promise.all)
- Endpoint `/me` para el partner autenticado
- `GET /partners` para listar negocios activos

**Módulo Services**
- CRUD de servicios por partner con ownership check
- Filtrado por partner y estado activo
- Desactivar servicio sin eliminarlo

**Módulo Slots**
- Creación masiva de slots
- Bloqueo de día completo
- Disponibilidad por servicio y fecha — `GET /slots/available`
- Agenda del partner por fecha — `GET /slots/partner/:id`

**Módulo Bookings**
- Creación con `SELECT FOR UPDATE` (previene doble reserva)
- Ventana de cancelación configurable por negocio (`cancelWindowHours`)
- Marcado como completado por el partner
- Historial por usuario (`/bookings/my`) y por partner (`/bookings/partner`)

**Módulo Payments**
- Creación de preferencia MercadoPago sandbox
- Webhook `POST /payments/webhook` con verificación de firma `X-Signature`
- Transición automática de estados al recibir webhook (approved/rejected/cancelled)
- Liberación del slot si el pago falla

**Módulo Notifications**
- Cron `@EVERY_HOUR`: detecta turnos en las próximas 24hs y marca `reminder_sent`
- Garantía de idempotencia — no envía el mismo recordatorio dos veces
- Estructura lista para conectar Resend

**Módulo Reviews**
- `POST /reviews` — una reseña por turno completado (constraint UNIQUE en bookingId)
- `GET /reviews/partner/:id` — reseñas de un negocio
- Ownership check y validación de estado

### ⚠️ Notas del entorno de pruebas

**Emails**
Los emails están estructurados pero no se envían realmente. Cada evento (confirmación, cancelación, recordatorio, bienvenida) solo loguea en consola. Para activar el envío real hay que agregar la API key de Resend al `.env`.

**Webhook de pagos en local**
MercadoPago no puede llamar a `localhost`. Para probar el flujo completo de pago en local se necesita [ngrok](https://ngrok.com):
```bash
ngrok http 3000
# Copiar la URL https://xxxx.ngrok-free.app
# Actualizar BACKEND_URL en .env y reiniciar el backend
```
En producción con URL pública esto funciona automáticamente.

### 📋 Pendiente

- Módulo de favoritos
- Paginación en endpoints de búsqueda
- Migraciones TypeORM (reemplazar `synchronize`)
- Índices de base de datos
- Tests unitarios e integración
- Deploy a Render / Railway

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Partner (seed) | `partner@axen.demo` | `Demo1234` |
| Usuario | Registrarse desde la app | mín. 8 caracteres, 1 mayúscula, 1 número |

## Equipo

**Flor Gomez Pacheco** — Backend · Panel web  
**Franco Chiquilito** — Backend · App móvil
