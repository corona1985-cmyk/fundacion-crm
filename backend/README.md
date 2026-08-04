# Backend CRM - Fundación "Rompiendo Paradigmas"

Backend REST API for Fundación Rompiendo Paradigmas CRM system built with Node.js, Express.js, Sequelize ORM, and PostgreSQL.

## Module 1: Authentication and User Management

### Included Features & Specifications

- **Authentication & RBAC**: JWT authorization tokens with 24-hour expiration. Role-based access control supporting `ADMINISTRADOR`, `COORDINADOR`, `FINANCIERO`, `CONSULTA`.
- **Database Models**:
  - `Persona`: Personal profiles (First/Last name, identity ID/cédula, email, phone, address).
  - `Usuario`: Access credentials, username, password hash, role, status (`activo`), and soft-delete (`paranoid: true`).
  - `Auditoria`: Centralized security & data modification audit log (`usuario_id`, `accion`, `entidad`, `entidad_id`, `datos_previos`, `datos_nuevos`, `ip_origen`, `fecha_hora`).
- **Security & Integrity**:
  - Passwords hashed via `bcryptjs` with salt rounds = 10.
  - Strict password validation (minimum 8 characters, >=1 uppercase, >=1 lowercase, >=1 digit, >=1 special character).
  - Brute force protection on `POST /auth/login` via rate limiting (5 attempts per 15 min).
  - Database indexes on `Persona.cedula`, `Persona.email`, `Usuario.username`, `Auditoria (usuario_id, fecha_hora)`.
  - Centralized global error handling with standardized JSON responses.

---

### Endpoints Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticates credentials and returns JWT token. |
| `POST` | `/auth/register` | Admin | Registers new `Persona` and `Usuario`. |
| `GET` | `/auth/me` | Authenticated | Gets profile information of current logged user. |
| `PUT` | `/auth/me` | Authenticated | Updates personal profile or changes password. |
| `POST` | `/auth/logout` | Authenticated | Logs out current session. |
| `GET` | `/users` | Admin | Paginated user list with role/status/search filters. |
| `GET` | `/users/:id` | Admin | User detail by ID. |
| `PUT` | `/users/:id` | Admin | Updates user role, active status, or persona info. |
| `DELETE` | `/users/:id` | Admin | Soft deletes user (`activo = false` & `deleted_at`). |
| `GET` | `/audit` | Admin | Paginated audit log records with action/entity filters. |

---

### Getting Started

#### 1. Requirements
- Node.js >= 20.x
- PostgreSQL >= 15.x

#### 2. Installation
```bash
cd backend
npm install
```

#### 3. Environment Setup
Copy `.env.example` to `.env` and configure your PostgreSQL database credentials:
```bash
cp .env.example .env
```

#### 4. Database Setup & Migrations
Create your database and run migrations:
```bash
# Run migrations
npm run db:migrate

# Create initial admin user (default credentials: admin / Admin123!)
npm run create-admin
```

#### 5. Running the Application
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

#### 6. Executing Tests
```bash
# Run test suite
npm test

# Run test suite with coverage report
npm run test:coverage
```
