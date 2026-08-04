# Guía de Despliegue en Servidores Gratuitos ($0/mes)
## CRM Fundación "Rompiendo Paradigmas"

Esta guía detalla los pasos exactos para desplegar el sistema CRM completo en la nube sin costo alguno, utilizando la combinación de servicios gratuitos más robusta del mercado:

- **Frontend (React SPA):** Vercel (Hobby Plan Gratuito)
- **Backend (Node.js/Express API):** Render (Free Web Service)
- **Base de Datos (PostgreSQL):** Supabase / Neon.tech (500 MB Gratuito)
- **Redis (Caché y Colas):** Upstash (Free Tier - 10,000 req/día)
- **Costo total:** **$0 / mes** (Sin necesidad de ingresar tarjeta de crédito)

---

## FASE 1: Base de Datos PostgreSQL en Supabase

1. Crear cuenta gratuita en [supabase.com](https://supabase.com/).
2. Crear un nuevo proyecto:
   - **Nombre:** `fundacion-crm-db`
   - **Database Password:** Generar una contraseña segura y guardarla.
   - **Region:** Seleccionar `US East (N. Virginia)` o la más cercana.
3. Ir a **Project Settings > Database > Connection String > URI**.
4. Copiar la URI de conexión (ejemplo: `postgresql://postgres.ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`).
5. **Ejecutar Migraciones y Datos Semilla desde tu máquina local:**
   ```bash
   cd backend
   export DATABASE_URL="postgresql://postgres.ref:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   
   # Ejecutar migraciones
   npx sequelize-cli db:migrate
   
   # Crear usuario administrador inicial
   npm run create-admin
   
   # Cargar catálogos iniciales
   npm run seed:academic
   npm run seed:sponsors
   npm run seed:financial
   ```

---

## FASE 2: Backend Node.js/Express en Render

1. Crear cuenta gratuita en [render.com](https://render.com/).
2. Hacer clic en **New + > Web Service**.
3. Conectar tu repositorio de GitHub `crm-becas`.
4. Configurar los siguientes parámetros:
   - **Name:** `fundacion-crm-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Region:** `Oregon (US West)` o `Ohio (US East)`
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. En la sección **Environment Variables**, agregar las siguientes claves:

   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Tu URI de Supabase (`postgresql://...`) |
   | `JWT_SECRET` | `clave_jwt_segura_fundacion_rompiendo_paradigmas_2026` |
   | `FRONTEND_URL` | `https://fundacion-crm.vercel.app` |

6. Hacer clic en **Create Web Service**.
7. Copiar la URL asignada por Render (ej. `https://fundacion-crm-backend.onrender.com`).

---

## FASE 3: Frontend React SPA en Vercel

1. Crear cuenta gratuita en [vercel.com](https://vercel.com/).
2. Hacer clic en **Add New... > Project**.
3. Importar el repositorio `crm-becas` desde GitHub.
4. Configurar el proyecto:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit -> seleccionar `frontend`
5. En **Environment Variables**, agregar:

   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://fundacion-crm-backend.onrender.com` (La URL de tu backend en Render) |

6. Hacer clic en **Deploy**.
7. ¡Listo! Vercel desplegará la aplicación e indicará la URL pública (ej. `https://fundacion-crm.vercel.app`).

---

## FASE 4: Verificación Final

1. Abrir la aplicación frontend en `https://fundacion-crm.vercel.app`.
2. Probar inicio de sesión con las credenciales de administrador:
   - **Usuario:** `admin`
   - **Contraseña:** `Admin123!`
3. Verificar que las listas de becarios, padrinos, finanzas y alarmas cargan correctamente desde la API en Render y la base de datos Supabase.

---

## Resumen de URLs Públicas:
- **Frontend SPA:** `https://fundacion-crm.vercel.app`
- **Backend API:** `https://fundacion-crm-backend.onrender.com`
- **Health Check API:** `https://fundacion-crm-backend.onrender.com/health`
