# CRM Fundación "Rompiendo Paradigmas" - Frontend (React + Ant Design)

Single Page Application (SPA) para el CRM de la Fundación "Rompiendo Paradigmas", desarrollado con **React**, **Ant Design**, **Axios**, **Recharts** y **React Router DOM v6**.

## Tecnologías Principales

- **Framework:** React 19 + Vite
- **UI & Componentes:** Ant Design (`antd` v6) & `@ant-design/icons`
- **Cliente HTTP:** Axios con Interceptores JWT
- **Gráficos & Visualización:** Recharts
- **Enrutamiento:** React Router DOM v6 (Rutas Protegidas por Rol)

## Pantallas Implementadas

1. **Autenticación (`/login`):** Inicio de sesión con JWT y manejo de sesiones.
2. **Dashboard (`/dashboard`):** Panel principal con KPIs (Becarios, Padrinos, Flujo Financiero), gráfico Recharts y alarmas de pagos vencidos.
3. **Gestión de Becarios (`/becarios`):** Tabla con búsqueda, filtros por universidad y estado, y modal de registro/edición.
4. **Expediente de Becario (`/becarios/:id`):** Vista en pestañas (Datos personales, Historial Académico, Subida de Documentos/Expediente, Pagos Universitarios).
5. **Padrinos e Instituciones (`/padrinos`):** Gestión de padrinos (naturales/empresariales), instituciones públicas y compromisos de aportes.
6. **Detalle de Padrino (`/padrinos/:id`):** Historial de aportes financieros y becarios asignados.
7. **Gestión Financiera (`/financiero`):** Pagos universitarios (marcar como pagado), control de ejecución presupuestaria y Estado Financiero Global.
8. **Centro de Alarmas (`/alarmas`):** Notificación y gestión de pagos vencidos.

## Instrucciones de Instalación y Ejecución Local

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz de `/frontend`:

```env
VITE_API_URL=http://localhost:5000
```

### 2. Ejecución en Desarrollo
```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 3. Build de Producción
```bash
npm run build
```

Generará los archivos optimizados dentro del directorio `dist/`.
