markdown
# Especificación de Interfaz de Usuario (UI) - CRM Fundación "Rompiendo Paradigmas"

**Versión:** 1.0  
**Fecha:** 31 de julio de 2026  
**Framework Frontend:** React + Ant Design (o Angular con Ant Design)  
**Responsive:** Sí, adaptable a dispositivos móviles y tablets.  
**Idioma:** Español (interfaz) con soporte para inglés en el futuro.

---

## 1. Estructura General de la Aplicación

La aplicación seguirá un patrón de **Layout con menú lateral fijo** (Sider) y área de contenido principal, típico de sistemas de administración (CRM).

### 1.1. Layout Principal
+--------------------------------------------------+
| LOGO | Barra Superior (Header) |
| Fundación | Usuario | Notificaciones | Salir |
+----------------+----------------------------------+
| Menú Lateral | |
| (Sider) | Área de Contenido Principal |
| | |
| - Dashboard | |
| - Becarios | |
| - Padrinos | |
| - Instituciones| |
| - Académico | |
| - Finanzas | |
| - Documentos | |
| - Alarmas | |
| - Reportes | |
| - Usuarios | |
| - Auditoría | |
+----------------+----------------------------------+

text

### 1.2. Componentes Compartidos

- **Header:** Muestra el nombre del usuario autenticado, un ícono de campana para notificaciones no leídas (con contador), y un botón de cerrar sesión.
- **Sider (Menú):** Navegación colapsable, con íconos de Ant Design, que se adapta según el rol del usuario (permisos).
- **Footer:** (Opcional) Información de la versión y año.

---

## 2. Módulos y Pantallas (Por Módulo)

### 2.1. Módulo de Autenticación

#### Pantalla: Login (`/login`)

- **Descripción:** Página pública para iniciar sesión.
- **Componentes:**
  - Formulario con campos: `Usuario` (input), `Contraseña` (password).
  - Botón "Iniciar Sesión".
  - Enlace "Olvidé mi contraseña" (funcionalidad futura).
- **Comportamiento:**
  - Validación en frontend (campos requeridos).
  - Al enviar, llamada a API `/auth/login`.
  - En caso de éxito, guarda token en localStorage/context y redirige a `/dashboard`.
  - Muestra mensajes de error (credenciales inválidas, usuario inactivo).

#### Pantalla: Cambio de Contraseña (dentro de perfil)

- **Acceso:** Desde el menú de usuario en el Header.
- **Componentes:**
  - Modal o página con campos: Contraseña actual, Nueva contraseña, Confirmar nueva.
- **Comportamiento:**
  - Validación de coincidencia y fortaleza.
  - PUT `/auth/me` con la nueva contraseña.

---

### 2.2. Dashboard (`/dashboard`)

- **Descripción:** Página de inicio con resumen de métricas clave.
- **Componentes:**
  - Tarjetas (Cards) con números destacados:
    - Total de becarios activos.
    - Total de padrinos activos.
    - Aportes del mes (monto total).
    - Pagos pendientes (cantidad y monto).
    - Alarmas activas (con prioridad alta destacada).
  - Gráficos:
    - Evolución de aportes en los últimos 6 meses (chart de líneas).
    - Distribución de becarios por universidad (gráfico de barras o pastel).
    - Índices académicos promedio por carrera (opcional).
  - Tabla de "Últimas alarmas" con las más recientes y su estado.
  - Botón "Ver todas las alarmas" que redirige a `/alarmas`.

---

### 2.3. Módulo de Usuarios y Seguridad (`/usuarios`)

#### Pantalla: Listado de Usuarios

- **Acceso:** Solo administradores.
- **Componentes:**
  - Tabla con columnas: ID, Nombre, Usuario, Rol, Estado (activo/inactivo), Acciones.
  - Botón "Nuevo Usuario" que abre modal/formulario de creación.
  - Barra de búsqueda y filtros (por rol, estado).
  - Paginación.
- **Acciones por fila:** Editar, Deshabilitar/Habilitar, Ver auditoría del usuario.

#### Modal / Pantalla: Crear/Editar Usuario

- **Componentes:**
  - Datos personales (nombre, apellido, cédula, fecha nacimiento, teléfono, email, dirección).
  - Datos de acceso (username, password, rol).
  - Checkbox "Activo" (solo en edición).
- **Validaciones:** Cédula única, email único, username único, password con requisitos de seguridad.

#### Pantalla: Auditoría de Usuario

- **Acceso:** Desde el listado, botón "Ver auditoría" o desde el módulo de Auditoría global.
- **Componentes:**
  - Tabla con todas las acciones realizadas por ese usuario (fecha, entidad, acción, datos modificados).
  - Filtros por fecha.

---

### 2.4. Módulo de Becarios (`/becarios`)

#### Pantalla: Listado de Becarios

- **Acceso:** Coordinadores, Administradores (y Financieros en vista limitada).
- **Componentes:**
  - Tabla con columnas: ID, Nombre, Cédula, Universidad, Carrera, Estado de beca, Promedio, Acciones.
  - Botón "Nuevo Becario" (inicia proceso de selección).
  - Filtros avanzados: Universidad, Carrera, Estado de beca, Centro de origen, Rango de fechas de selección.
  - Barra de búsqueda por nombre, cédula.

#### Pantalla: Detalle de Becario (Expediente) (`/becarios/:id`)

- **Descripción:** Vista completa de un becario con pestañas (tabs).
- **Pestañas:**
  1. **Datos Personales:** Todos los datos de Persona + datos específicos de becario (universidad, carrera, centro origen, fecha selección, estado).
  2. **Académico:**
     - Historial de ciclos y materias cursadas (tabla con ciclo, materia, calificación, estado).
     - Promedio general y por ciclo.
     - Botón "Cargar Materias" (para el ciclo actual).
  3. **Padrino/Financiamiento:** Muestra el padrino asignado (nombre, contacto) o indica que es financiado por la fundación. Botón para asignar/desasignar padrino.
  4. **Pagos:** Lista de pagos realizados a la universidad por este becario (concepto, fecha, monto, estado). Botón "Registrar Pago".
  5. **Documentos:** Lista de documentos subidos (tipo, nombre, fecha subida, fecha vencimiento). Botón "Subir Documento".
  6. **Alarmas:** Historial de alarmas generadas para este becario.

- **Acciones rápidas:** Botones para editar datos generales, cambiar estado de beca, generar reporte académico individual.

#### Modal: Crear Becario (Proceso de Selección)

- **Paso 1:** Datos personales (igual que usuario).
- **Paso 2:** Datos académicos (seleccionar universidad, carrera, centro educativo de origen, fecha selección).
- **Paso 3:** Subida de documentos requeridos (checklist con tipos: cédula, acta de nacimiento, certificado de estudios, foto, etc.).
- **Paso 4:** Asignar padrino (opcional, se puede hacer después).

#### Modal: Cargar Materias y Calificaciones

- **Componentes:**
  - Seleccionar ciclo académico (desplegable con ciclos activos de la universidad).
  - Lista de materias del pensum (con checkbox para seleccionar las que cursará en ese ciclo).
  - Después de seleccionar materias, se muestra una tabla para ingresar calificaciones (al final del ciclo).
  - Botón "Guardar" que actualiza el historial y recalcula el promedio.

---

### 2.5. Módulo de Padrinos e Instituciones

#### Pantalla: Listado de Padrinos (`/padrinos`)

- **Tabla:** Nombre/Razón social, Tipo, Monto compromiso, Frecuencia, Estado (activo/inactivo), Acciones.
- **Botón "Nuevo Padrino".**
- **Filtros:** Tipo (natural/jurídica), estado, rango de monto.

#### Pantalla: Detalle de Padrino

- **Pestañas:**
  1. **Datos Generales** (persona o empresa).
  2. **Aportes:** Historial de aportes recibidos (fecha, monto, medio).
  3. **Becarios Apadrinados:** Lista de becarios asignados a este padrino.
  4. **Documentos:** Contratos, etc.

#### Pantalla: Listado de Instituciones Públicas (`/instituciones`)

- Similar al de padrinos, pero con campos específicos (contacto, email, teléfono).

---

### 2.6. Módulo Académico (`/academico`)

#### Pantalla: Universidades (`/universidades`)

- Tabla con nombre, dirección, teléfono, contacto.
- Botón "Agregar Universidad".
- Cada universidad tiene un enlace a sus carreras.

#### Pantalla: Carreras por Universidad

- Tabla de carreras con nombre, duración en ciclos.
- Botón "Agregar Carrera".
- Cada carrera tiene un enlace a su pensum (materias).

#### Pantalla: Pensum (Materias de una Carrera)

- Lista de materias con código, nombre, créditos, nivel.
- Botón "Agregar Materia".
- Opción para definir prerrequisitos (materias que deben aprobarse antes).

#### Pantalla: Ciclos Académicos

- Tabla de ciclos (nombre, fecha inicio, fecha fin, fecha límite de pago, universidad, activo).
- Botón "Crear Ciclo".
- Opción para marcar un ciclo como "actual".

---

### 2.7. Módulo Financiero

#### Pantalla: Pagos a Universidades (`/pagos`)

- Tabla con columnas: Becario, Concepto, Monto, Fecha Vencimiento, Estado, Acciones.
- Botón "Registrar Pago" (abre formulario con becario, concepto, monto, fecha vencimiento).
- Filtros: Estado, rango de fechas, becario.

#### Pantalla: Registro de Aportes (`/aportes`)

- Tabla con: Padrino/Institución, Monto, Fecha Recepción, Medio, Referencia.
- Botón "Registrar Aporte" (seleccionar padrino o institución, monto, fecha, medio).
- Filtros por padrino, institución, rango de fechas.

#### Dashboard Financiero (Submódulo)

- Gráficos de ingresos vs gastos mensuales.
- Cuentas por cobrar (aportes esperados no recibidos).
- Cuentas por pagar (pagos pendientes a universidades).
- Resumen de presupuesto vs ejecutado.

---

### 2.8. Módulo de Alarmas y Notificaciones

#### Pantalla: Listado de Alarmas (`/alarmas`)

- Tabla con: Código, Tipo, Descripción, Entidad relacionada, Fecha generación, Prioridad, Estado, Acciones.
- Botón "Resolver" (cambia estado a resuelta).
- Filtros: Tipo, Estado, Prioridad, rango de fechas.
- Indicador de alarmas activas (contador en el menú).

#### Panel de Notificaciones (Dropdown en Header)

- Lista de notificaciones recientes (no leídas primero).
- Cada notificación tiene un enlace para ir a la entidad relacionada.
- Botón "Marcar todas como leídas".
- Contador de no leídas.

---

### 2.9. Módulo de Documentos

#### Pantalla: Gestión de Documentos por Becario

- Dentro del expediente del becario, pestaña Documentos.
- Lista con columnas: Tipo, Nombre, Fecha Subida, Fecha Vencimiento, Acciones (descargar, eliminar).
- Botón "Subir Documento" (modal con selector de tipo y archivo).

#### Submódulo: Gestión de Documentos de Padrinos

- Similar, pero dentro del detalle del padrino.

---

### 2.10. Módulo de Reportes

#### Pantalla: Centro de Reportes (`/reportes`)

- Menú de reportes predefinidos:
  - Listado general de becarios (exportable a Excel).
  - Historial académico por becario (PDF).
  - Resumen de aportes por padrino (con gráficos).
  - Estado de pagos a universidades.
  - Comparativo presupuesto vs ejecutado.
  - Reporte de alarmas resueltas/no resueltas.
- Opción para generar reportes personalizados (selección de campos y filtros).
- Botones de exportación (Excel, PDF, CSV).

---

## 3. Flujos de Navegación Clave

### 3.1. Proceso de Selección de un Becario

1. Desde el listado de becarios, click en "Nuevo Becario".
2. Se abre un wizard (pasos) o formulario largo en pestañas.
3. Paso 1: Datos personales (nombre, cédula, etc.).
4. Paso 2: Datos académicos (universidad, carrera, centro origen, fecha selección).
5. Paso 3: Subir documentos obligatorios (mínimo cédula y acta de nacimiento).
6. Paso 4: Asignar padrino (opcional, se puede saltar).
7. Guardar. El becario queda con estado "Preseleccionado" o "Aceptado" (según configuración).
8. Luego, desde el detalle, se pueden cargar materias y pagos.

### 3.2. Carga de Calificaciones

1. Ir al detalle del becario.
2. Pestaña Académica.
3. Seleccionar ciclo académico (desplegable).
4. Seleccionar materias cursadas (checklist).
5. Ingresar calificaciones (una por materia).
6. Guardar. El sistema recalcula el promedio.

### 3.3. Registro de un Aporte

1. Desde el módulo de Aportes o desde el detalle del padrino.
2. Seleccionar padrino o institución.
3. Ingresar monto, fecha de recepción, medio de pago, referencia (opcional).
4. Guardar. Se actualiza el saldo del padrino y se genera notificación de aporte recibido.

### 3.4. Resolución de una Alarma

1. Desde el listado de alarmas (o dashboard), click en "Resolver" en una alarma.
2. Se abre un modal para confirmar y añadir observaciones (opcional).
3. Confirmar. La alarma cambia a estado "Resuelta" y se registra en auditoría.

---

## 4. Componentes Reutilizables (Ant Design)

Se crearán componentes genéricos para acelerar el desarrollo:

- `DataTable`: Tabla con paginación, filtros, ordenamiento y acciones.
- `SearchBar`: Barra de búsqueda con entrada de texto y botón.
- `FilterPanel`: Panel de filtros avanzados (desplegable o lateral).
- `FormModal`: Modal con formulario para creación/edición.
- `LoadingSpinner`: Indicador de carga.
- `ErrorBoundary`: Manejo de errores en componentes.
- `NotificationBell`: Icono de campana con contador.
- `AvatarUser`: Muestra iniciales o foto del usuario.
- `StatusBadge`: Etiqueta para estados (activo, inactivo, pagado, pendiente, etc.).

---

## 5. Consideraciones de UX/UI

- **Colores:** Usar la paleta de Ant Design (azul principal, verde para éxito, rojo para errores, etc.).
- **Tipografía:** Fuente predeterminada de Ant Design.
- **Espaciado:** Consistente (márgenes y paddings).
- **Validaciones en tiempo real:** Mostrar errores debajo de los campos al perder el foco o al enviar.
- **Mensajes de confirmación:** Para acciones destructivas (eliminar, deshabilitar) usar modales de confirmación (Popconfirm).
- **Feedback de acciones:** Usar notificaciones (toast) para éxito/error (ej. "Becario creado exitosamente").
- **Responsive:** El menú lateral se colapsa en dispositivos móviles (con un botón de hamburguesa).

---

## 6. Instrucciones para el Agente de Antigravity

Una vez aprobado, usa esta instrucción:

> "Con base en `frontend-ui-specification.md`, genera la estructura base del frontend con React y Ant Design. Implementa el layout principal (Header, Sider, Content) con el menú dinámico según rol. Crea la pantalla de Login y el Dashboard con estadísticas simuladas. Luego, para el Módulo 1 (Usuarios), implementa el listado y el formulario de creación/edición de usuarios, consumiendo la API que ya desarrollamos."

---

## 7. Próximos Pasos

- **Diseño detallado de componentes** (en el siguiente documento, se pueden especificar props y estados).
- **Prototipos visuales** (opcional, se puede generar con herramientas como Figma o directamente en código con Ant Design).

---

**Próximo documento:** `development-guide.md` (guía de desarrollo, configuraciones, variables de entorno, y cómo ejecutar el proyecto localmente).