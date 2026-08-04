# Manual Técnico de Despliegue en Producción & Operaciones

Este documento contiene la guía paso a paso para desplegar, asegurar y administrar el sistema CRM de la **Fundación "Rompiendo Paradigmas"** en un servidor de producción Ubuntu 22.04 LTS.

---

## 1. Arquitectura del Entorno de Producción

- **Servidor Operativo:** Ubuntu 22.04 LTS (AWS EC2 t3.medium / GCP Compute Engine / DigitalOcean Droplet con 4 vCPUs, 8 GB RAM, 50 GB SSD).
- **Servidor Web y Proxy Reverso:** Nginx 1.24+ con compresión Gzip y headers de seguridad HTTP.
- **Base de Datos:** PostgreSQL 15 con conexiones cifradas.
- **Caché y Colas:** Redis 7 server.
- **Gestión de Procesos:** PM2 con clúster para API y scheduler/workers independientes.
- **Seguridad:** Certificado SSL/HTTPS de Let's Encrypt administrado por Certbot + Firewall UFW.
- **Despliegue Continuo (CI/CD):** GitHub Actions integrado vía SSH.

---

## 2. Paso a Paso para la Configuración Inicial del Servidor

### Paso 2.1: Conexión SSH y Preparación de Dependencias
```bash
# 1. Clonar el repositorio en el servidor
sudo mkdir -p /var/www/crm-becas
sudo chown -R $USER:$USER /var/www/crm-becas
git clone https://github.com/tu-usuario/crm-becas.git /var/www/crm-becas

# 2. Ejecutar script de instalación de dependencias
cd /var/www/crm-becas
chmod +x deploy/*.sh scripts/*.sh
./deploy/install-dependencies.sh
```

### Paso 2.2: Aprovisionamiento de PostgreSQL
```bash
# Definir contraseñas seguras y ejecutar el script de BD
export DB_NAME="fundacion_crm"
export DB_USER="fundacion_user"
export DB_PASS="TU_CONTRASEÑA_SEGURA"

./deploy/setup-database.sh
```

### Paso 2.3: Configurar Variables de Entorno del Backend (`backend/.env`)
Crear el archivo `/var/www/crm-becas/backend/.env` con la siguiente configuración:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://app.fundacionrompiendoparadigmas.org
BASE_URL=https://app.fundacionrompiendoparadigmas.org/api

# Configuración de Base de Datos PostgreSQL
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=fundacion_crm
DB_USER=fundacion_user
DB_PASSWORD=TU_CONTRASEÑA_SEGURA

# Autenticación JWT
JWT_SECRET=CLAVE_SUPER_SECRETA_JWT_FUNDACION_2026
JWT_EXPIRES_IN=24h

# Almacenamiento en Nube
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=AKIA_TU_AWS_KEY
AWS_SECRET_ACCESS_KEY=TU_AWS_SECRET
AWS_REGION=us-east-1
S3_BUCKET_NAME=fundacion-crm-documentos
```

### Paso 2.4: Nginx & Certificado SSL HTTPS
```bash
# Configurar Nginx
export DOMAIN="app.fundacionrompiendoparadigmas.org"
./deploy/setup-nginx.sh

# Emitir certificado SSL de Let's Encrypt
sudo certbot --nginx -d app.fundacionrompiendoparadigmas.org
```

---

## 3. Despliegue con PM2

```bash
cd /var/www/crm-becas/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Comandos de Monitoreo PM2:
- Ver estado de procesos: `pm2 status`
- Ver logs en tiempo real: `pm2 logs`
- Monitoreo en vivo: `pm2 monit`

---

## 4. Automatización de Respaldos (Crontab)

Para programar respaldos diarios de la base de datos a las 2:00 AM y limpieza automática de archivos viejos:

```bash
sudo crontab -e
```

Añadir las siguientes líneas:
```cron
# Respaldo diario de base de datos PostgreSQL a las 02:00 AM
0 2 * * * /var/www/crm-becas/scripts/backup-db.sh >> /var/log/crm-backup-db.log 2>&1

# Respaldo semanal de expedientes a las 03:00 AM los domingos
0 3 * * 0 /var/www/crm-becas/scripts/backup-uploads.sh >> /var/log/crm-backup-uploads.log 2>&1
```

---

## 5. Configuración de CI/CD (GitHub Secrets)

En el repositorio de GitHub, navegar a **Settings > Secrets and variables > Actions** y añadir los siguientes secretos:

| Nombre del Secreto | Descripción / Valor |
| :--- | :--- |
| `SSH_HOST` | Dirección IP pública o nombre de dominio del servidor |
| `SSH_USER` | Usuario SSH con permisos (ej. `ubuntu` o `deployer`) |
| `SSH_KEY` | Clave privada SSH RSA/ED25519 para autenticación sin contraseña |
| `APP_PATH` | Ruta absoluta de la aplicación en el servidor (`/var/www/crm-becas`) |

Cada `push` a la rama `main` ejecutará automáticamente las pruebas de backend, compilará el frontend SPA y realizará un despliegue sin tiempo de inactividad (*zero-downtime deployment*).
