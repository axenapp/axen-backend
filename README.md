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

### ✅ Fase 1 — Configuración inicial
- Proyecto NestJS inicializado con TypeScript
- PostgreSQL 15 en contenedor Docker
- TypeORM conectado con sincronización automática en desarrollo
- ValidationPipe global (whitelist, transform, forbidNonWhitelisted)
- CORS configurado para el panel web
- Prefijo global `/api/v1`
- Estructura de módulos creada

### ✅ Fase 2 — Autenticación
- Entidad `User` con UUID, roles enum (user/partner/admin), soft delete y bloqueo por intentos fallidos
- `POST /api/v1/auth/register` — registro con hash bcrypt (factor 12) y validación de email único
- `POST /api/v1/auth/login` — login con verificación de contraseña y bloqueo tras 5 intentos fallidos (15 min)
- Generación de JWT con payload `{ sub, email, role }`
- `passwordHash` nunca expuesto en las respuestas

### ⏳ En progreso
- JwtAuthGuard y RolesGuard
- ExceptionFilter global
- Módulo Partners (onboarding)

### 📋 Pendiente
- Módulo Services (catálogo)
- Módulo Slots (disponibilidad)
- Módulo Bookings (reservas con SELECT FOR UPDATE)
- Módulo Payments (MercadoPago webhook)
- Módulo Notifications (Resend + cron)
- Módulo Reviews (calificaciones)
- Deploy en Render

---

## Documentación técnica

La arquitectura completa del sistema está documentada en el repositorio de la organización:
[axenapp/docs](https://github.com/axenapp)

Incluye diagramas UML, esquema de base de datos, flujos de interacción, decisiones arquitectónicas y requisitos funcionales y no funcionales.

---

## Equipo

- **Franco Chiquilito** — Backend + App móvil
- **Flor Gomez Pacheco** — Panel web

