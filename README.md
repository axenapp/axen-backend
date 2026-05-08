# Axen Backend

API REST del sistema Axen — Plataforma integral de reservas de servicios locales.

## Stack

- **Framework:** NestJS + TypeScript
- **Base de datos:** PostgreSQL 15 + TypeORM
- **Autenticación:** JWT + Passport.js
- **Pagos:** MercadoPago (sandbox)
- **Emails:** Resend
- **Geolocalización:** Google Maps Geocoding API
- **Contenedor BD:** Docker

---

## Requisitos

- Node.js v18 o superior
- npm v9 o superior
- Docker Desktop
- Git

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/axenapp/axen-backend.git
cd axen-backend

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env
# Completar los valores en .env

# 4. Levantar PostgreSQL con Docker
docker-compose up -d

# 5. Levantar el servidor en modo desarrollo
npm run start:dev
```

El servidor corre en `http://localhost:3000/api/v1`

---

## Variables de entorno

Ver `.env.example` para la lista completa de variables requeridas.

---

## Estructura del proyecto
src/
├── modules/
│   ├── auth/           # Autenticación y registro
│   ├── users/          # Entidad y gestión de usuarios
│   ├── partners/       # Negocios y onboarding
│   ├── services/       # Catálogo de servicios
│   ├── slots/          # Disponibilidad horaria
│   ├── bookings/       # Reservas de turnos
│   ├── payments/       # Pagos con MercadoPago
│   ├── notifications/  # Emails y recordatorios
│   └── reviews/        # Calificaciones
├── common/
│   ├── guards/         # JwtAuthGuard, RolesGuard
│   ├── decorators/     # @Roles, @CurrentUser
│   ├── filters/        # ExceptionFilter global
│   └── pipes/          # Pipes de validación
├── config/             # Configuración centralizada
├── app.module.ts
└── main.ts

---

## Endpoints disponibles

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Registro de usuario | No |
| POST | `/api/v1/auth/login` | Login y obtención de JWT | No |

---

## Progreso del desarrollo

✅ Fase 1 — Configuración inicial

Proyecto NestJS inicializado con TypeScript
PostgreSQL 15 en contenedor Docker (docker-compose up -d)
TypeORM conectado con sincronización automática en desarrollo
ValidationPipe global (whitelist, transform, forbidNonWhitelisted)
ExceptionFilter global con formato estándar de errores y traceId UUID
CORS configurado para el panel web
Prefijo global /api/v1
Estructura de módulos creada

✅ Fase 2 — Autenticación

Entidad User con UUID, roles enum (user/partner/admin), soft delete y bloqueo por intentos fallidos
POST /api/v1/auth/register — registro con hash bcrypt (factor 12) y validación de email único
POST /api/v1/auth/login — login con verificación de contraseña y bloqueo tras 5 intentos fallidos (15 min)
Generación de JWT con payload { sub, email, role }
JwtStrategy con Passport para validación del token en cada request
JwtAuthGuard para proteger rutas que requieren autenticación
RolesGuard para control de acceso por rol
@Roles y @CurrentUser decoradores
GET /api/v1/auth/profile — endpoint protegido de prueba
passwordHash nunca expuesto en las respuestas

✅ Fase 3 — Módulo Partners

Entidad Partner con UUID, userId FK, status enum (draft/active/suspended), cancelWindowHours
POST /api/v1/partners — crear negocio (cambia rol del usuario a partner, estado inicial draft)
GET /api/v1/partners/me — ver mi propio negocio
GET /api/v1/partners/:id — ver negocio por ID
PATCH /api/v1/partners/:id — actualizar datos del negocio
PATCH /api/v1/partners/:id/location — geocodificar dirección con Google Maps
PATCH /api/v1/partners/:id/activate — activar negocio (draft → active)
GeocodingService integrado con Google Maps Geocoding API
Mock de geocodificación cuando no hay API key (retorna coordenadas de Buenos Aires)
Partners en estado draft no aparecen en búsquedas (RN-05)

✅ Fase 4 — Módulo Services

Entidad Service con UUID, partnerId FK, duration, price, isActive
POST /api/v1/services — crear servicio (solo partners)
GET /api/v1/services — listar todos los servicios activos
GET /api/v1/services/partner/:partnerId — servicios por partner
GET /api/v1/services/:id — ver servicio por ID
PATCH /api/v1/services/:id — actualizar servicio con ownership check
PATCH /api/v1/services/:id/deactivate — desactivar servicio
DELETE /api/v1/services/:id — eliminar servicio con ownership check (RN-07)
Validación precio mayor a 0 (RN-06)

✅ Fase 5 — Módulo Slots

Entidad Slot con UUID, serviceId FK, partnerId FK, datetime, status enum (free/reserved/blocked)
POST /api/v1/slots — crear slots en bulk (solo partners)
GET /api/v1/slots/available?serviceId=&date= — slots disponibles por servicio y fecha
GET /api/v1/slots/partner/:partnerId?date= — agenda del partner por fecha
POST /api/v1/slots/block-day — bloquear todos los slots libres de un día

✅ Fase 6 — Módulo Bookings

Entidad Booking con UUID, userId FK, slotId FK (UNIQUE), serviceId FK, status enum, reminderSent
POST /api/v1/bookings — crear reserva con transacción ACID y SELECT FOR UPDATE (RN-01)
GET /api/v1/bookings/my — historial de reservas del usuario
GET /api/v1/bookings/partner — reservas del negocio
GET /api/v1/bookings/:id — ver reserva por ID
PATCH /api/v1/bookings/:id/cancel — cancelar con validación de ventana horaria (RN-03, RN-04)
PATCH /api/v1/bookings/:id/complete — partner marca turno como completado
Campo reminderSent para idempotencia del cron de recordatorios (RN-08)

### ✅ Fase 7 — Módulo Notifications
- NotificationsService con stubs de email listos para Resend
- @Cron cada hora: busca turnos confirmados en las próximas 24hs con reminderSent=false
- Actualiza reminderSent=true tras enviar (RN-08 idempotencia)
- ScheduleModule registrado globalmente

### ✅ Fase 8 — Módulo Reviews
- Entidad Review con UNIQUE en bookingId (una reseña por turno, RN-02)
- POST /api/v1/reviews — crear reseña (solo para turnos completados)
- GET /api/v1/reviews/partner/:partnerId — reseñas del partner
- GET /api/v1/reviews/partner/:partnerId/average — promedio de calificación
- GET /api/v1/reviews/my — reseñas del usuario
- Ownership check y validación de estado completado (RN-02)

### ✅ Fase 9 — Dashboard del partner
- GET /api/v1/partners/dashboard — métricas del negocio (solo partners)
- Promise.all para queries paralelas: turnos de hoy, turnos del mes + ingresos, promedio de calificación, últimas reservas

### ⏳ Pendiente
- Integración real de Resend (requiere API key)
- Integración real de MercadoPago (requiere access token sandbox)
- Integración real de Google Maps (requiere API key)
- Tests unitarios e integración (Jest + Supertest)
- Deploy en Render + Railway/Supabase
---

## Documentación técnica

La arquitectura completa del sistema está documentada en el repositorio de la organización:
[axenapp/docs](https://github.com/axenapp)

Incluye diagramas UML, esquema de base de datos, flujos de interacción, decisiones arquitectónicas y requisitos funcionales y no funcionales.

---

## Equipo

- **Franco Chiquilito** — Backend + App móvil
- **Flor Gomez Pacheco** — Backend + Panel web

