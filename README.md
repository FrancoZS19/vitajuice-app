# VitaJuice by Rena - Sistema de Gestión Comercial e Inventario (MVP)

**Proyecto Tecnológico • ISIL • Metodología Scrum**  
Sistema integral a medida desarrollado para la marca peruana de shots funcionales y jugos prensados en frío **VitaJuice by Rena**.

---

## 1. Arquitectura del Proyecto (Actualizada: Frontend Estático Vanilla)

El sistema ahora cuenta con un frontend **100% estático (HTML5 + Vanilla JavaScript + Tailwind CSS vía CDN)**, eliminando por completo la necesidad de Node.js, Vite o transpiladores en el cliente. Es **100% compatible con la extensión Live Server de VS Code**.

```text
vitajuice-system/
├── backend/                  # API REST (Node.js + Express + Prisma + PostgreSQL Cloud)
│   ├── prisma/
│   │   ├── schema.prisma     # 8 entidades relacionales (Shots, Insumos, Recetas, Pagos)
│   │   └── seed.ts           # Datos iniciales reales de VitaJuice
│   ├── src/                  # Controladores REST, middleware JWT, pasarela Culqi
│   ├── package.json
│   └── .env.example
├── frontend/                 # APLICACIÓN WEB ESTÁTICA (Compatible con Live Server)
│   ├── index.html            # Estructura principal con Tailwind CDN y Lucide Icons
│   ├── style.css             # Estilos personalizados y reglas de impresión PDF
│   └── app.js                # Lógica Vanilla JS (DOM, estados, modales, Culqi, CSV)
└── README.md
```

---

## 2. Cómo Probar el Frontend con Live Server (Demostración Inmediata)

### Opción A: Prueba Rápida con Live Server (Autónoma en 1 click)
Gracias al diseño implementado en `app.js`, el frontend incluye un **motor de respaldo inteligente (mock data)** con el catálogo de los 7 shots de VitaJuice, insumos, alertas y recetas. Puedes probar la interfaz completa sin necesidad de encender el backend:

1. Abre la carpeta `vitajuice-system/frontend` en **VS Code**.
2. Asegúrate de tener instalada la extensión **Live Server** (de Ritwick Dey) en VS Code.
3. Haz clic derecho sobre `index.html` y selecciona:  
   👉 **"Open with Live Server"** (o presiona `Alt + L, Alt + O`).
4. Se abrirá automáticamente en tu navegador (usualmente en `http://127.0.0.1:5500/index.html`).
5. En la pantalla de login, haz clic en **"Llenar Credenciales Demo"** e ingresa al sistema.

### Opción B: Conectado a la Base de Datos PostgreSQL Cloud (Neon / Supabase)
Si deseas conectar el backend a tu base de datos en la nube:
1. En `backend/`, copia `.env.example` a `.env` y configura tu `DATABASE_URL` de Neon/Supabase.
2. Ejecuta `npx prisma db push` y `npx tsx prisma/seed.ts` para poblar la base de datos.
3. Inicia el servidor con `npm run dev` en el puerto `4000`.
4. Al abrir `index.html` con Live Server, el frontend detectará automáticamente la API en `http://localhost:4000/api` y el indicador superior cambiará a **"PostgreSQL Cloud Conectado"**.

---

## 3. Módulos Funcionales Disponibles en la Demo

1. **Dashboard:**
   - 4 tarjetas de métricas en vivo: Ventas Cobradas, Margen Real Estimado, Pedidos Activos y Unidades Vendidas.
   - Banner de advertencias operativas si existen alertas críticas.
   - Ranking de los 4 shots más vendidos y tabla de pedidos recientes.
2. **Ventas y Pedidos:**
   - Registro de nuevos pedidos de WhatsApp con selector dinámico de shots (+/- unidades) y cálculo automático de total.
   - Búsqueda en tiempo real por cliente, número de teléfono o N° de pedido.
   - Filtro por estado logístico (`PENDIENTE`, `EN_PREPARACION`, `EN_CAMINO`, `ENTREGADO`).
   - Botón **"Cobrar Culqi"** en pedidos pendientes.
3. **Pasarela Culqi Sandbox:**
   - Modal con selector de método: **Tarjeta de Débito/Crédito** (Visa/Mastercard) y **Yape con Código de Aprobación**.
   - Simula y valida la transacción, actualiza el pedido a `PAGADO` y descuenta inmediatamente el stock de insumos según su receta.
4. **Inventario y Compras:**
   - Tabla de materias primas con semáforos de stock (`ÓPTIMO`, `BAJO`, `CRÍTICO`).
   - Modal para registrar compras de insumos especificando proveedor, lote y **fecha de vencimiento**.
   - Historial cronológico de compras y trazabilidad de lotes perecederos.
5. **Fichas Técnicas (Recetas):**
   - Catálogo de los 7 shots de VitaJuice (Inmune, Detox, Energy, Glow, Anti-inflamatorio, Digestivo, Relax).
   - Cálculo automático del costo de producción unitario ($\sum \text{insumo} \times \text{costo}$) y margen proyectado.
   - Modal para agregar nuevos ingredientes o envases a la fórmula.
6. **Bandeja de Alertas:**
   - Alerta de insumos por debajo del umbral mínimo (ej. Cúrcuma con stock crítico).
   - Alerta de lotes próximos a vencer a menos de 7 días (ej. Piña golden fresca).
   - Alerta de pedidos estancados con más de 3 días sin cobrar, con **botón directo para abrir chat de WhatsApp**.
7. **Reportes y Rentabilidad:**
   - Desglose financiero: Total Facturado, Costo Real de Insumos Usados y Margen Bruto Real en S/. y %.
   - Botón **"Descargar Datos (CSV)"** que genera y descarga el archivo CSV sin librerías externas.
   - Botón **"Imprimir / Guardar en PDF"** con reglas `@media print` para exportar un PDF impecable para el profesor.

---

## 4. Justificaciones Técnicas para Sustentar ante el Docente (ISIL)

| Pregunta del Docente | Respuesta y Justificación Técnica |
| :--- | :--- |
| **¿Por qué migrar a Vanilla JS y HTML5 estático?** | *"Para optimizar los recursos y permitir que cualquier miembro del equipo o docente pueda ejecutar y evaluar la solución de inmediato mediante Live Server sin lidiar con versiones de Node.js, transpiladores pesados ni dependencias de npm en el cliente. La separación de responsabilidades se mantiene impecable."* |
| **¿Cómo se maneja el estado sin React?** | *"Se implementó un patrón de Estado Centralizado (`state`) en `app.js` que sincroniza el modelo de datos con el DOM mediante selectores nativos (`document.querySelector`) y funciones de renderizado declarativas."* |
| **¿Cómo se calculan los costos y márgenes?** | *"El sistema cruza cada pedido completado con su ficha técnica (`RecipeItem`) y el costo unitario de compra de cada insumo (`lastCost`). La rentabilidad es: $\text{Margen} = \text{Venta} - \sum (\text{Dosis de Insumo} \times \text{Costo})$, eliminando estimaciones al ojo."* |
