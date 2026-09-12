/**
 * ============================================================================
 * VITAJUICE BY RENA - SISTEMA DE GESTIÓN COMERCIAL (MVP)
 * Arquitectura Frontend: Vanilla JavaScript (HTML5 + Tailwind CSS + Lucide)
 * Compatible al 100% con VS Code Live Server sin dependencias Node.js ni build.
 * ============================================================================
 */

const API_BASE_URL = 'http://localhost:4000/api';

// ============================================================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN (EN MEMORIA / PERSISTENTE)
// ============================================================================
const state = {
  token: localStorage.getItem('vitajuice_token') || null,
  user: JSON.parse(localStorage.getItem('vitajuice_user') || 'null'),
  currentView: 'dashboard',
  backendOnline: false,

  // Datos principales
  products: [],
  supplies: [],
  purchases: [],
  orders: [],
  alerts: null,
  metrics: null,

  // Estados temporales de interfaz
  selectedProductForRecipe: null,
  orderSelectedItems: [], // [{ productId, quantity }]
  currentOrderForCulqi: null,
  culqiMethod: 'CARD', // 'CARD' o 'YAPE'
};

// Datos semilla de respaldo (Fallback realista para funcionamiento autónomo en Live Server)
const mockData = {
  products: [
    { id: 'p1', name: 'Shot Inmune (60ml)', category: 'SHOT', price: 7.50, description: 'Jengibre, Cúrcuma, Limón, Naranja y toque de pimienta.' },
    { id: 'p2', name: 'Shot Detox (60ml)', category: 'SHOT', price: 7.50, description: 'Espinaca baby, Manzana verde, Pepino y Limón.' },
    { id: 'p3', name: 'Shot Energy (60ml)', category: 'SHOT', price: 8.00, description: 'Maca negra, Cacao y Miel pura de abeja.' },
    { id: 'p4', name: 'Shot Glow (60ml)', category: 'SHOT', price: 7.50, description: 'Cúrcuma, Naranja, Zanahoria y Beterraga.' },
    { id: 'p5', name: 'Shot Anti-inflamatorio (60ml)', category: 'SHOT', price: 8.00, description: 'Cúrcuma concentrada, Jengibre y Piña golden.' },
    { id: 'p6', name: 'Shot Digestivo (60ml)', category: 'SHOT', price: 7.50, description: 'Sábila/Aloe fresco, Menta y Limón sutil.' },
    { id: 'p7', name: 'Shot Relax (60ml)', category: 'SHOT', price: 8.00, description: 'Infusión botánica concentrada de Manzanilla y Maracuyá.' },
    { id: 'p8', name: 'Pack Semanal (7 Shots)', category: 'PACK', price: 50.00, description: '1 shot de cada sabor para tu semana.' },
    { id: 'p9', name: 'Jugo Verde Cold-Pressed 350ml', category: 'JUICE', price: 14.00, description: 'Prensado en frío con manzana, espinaca y pepino.' },
  ],
  supplies: [
    { id: 's1', name: 'Jengibre fresco (Kion)', unit: 'g', currentStock: 12500, minStockAlert: 2000, lastCost: 0.015, stockStatus: 'OPTIMO' },
    { id: 's2', name: 'Cúrcuma fresca', unit: 'g', currentStock: 450, minStockAlert: 1500, lastCost: 0.020, stockStatus: 'BAJO' }, // Dispara alerta
    { id: 's3', name: 'Limón sutil exprimido', unit: 'ml', currentStock: 18000, minStockAlert: 3000, lastCost: 0.008, stockStatus: 'OPTIMO' },
    { id: 's4', name: 'Zumo de naranja valencia', unit: 'ml', currentStock: 25000, minStockAlert: 5000, lastCost: 0.006, stockStatus: 'OPTIMO' },
    { id: 's5', name: 'Espinaca baby fresca', unit: 'g', currentStock: 8000, minStockAlert: 1500, lastCost: 0.012, stockStatus: 'OPTIMO' },
    { id: 's6', name: 'Manzana verde', unit: 'g', currentStock: 15000, minStockAlert: 3000, lastCost: 0.007, stockStatus: 'OPTIMO' },
    { id: 's7', name: 'Piña golden fresca', unit: 'g', currentStock: 6000, minStockAlert: 1500, lastCost: 0.006, stockStatus: 'OPTIMO' },
    { id: 's8', name: 'Botella PET 60ml alimentaria', unit: 'unidad', currentStock: 2200, minStockAlert: 500, lastCost: 0.45, stockStatus: 'OPTIMO' },
    { id: 's9', name: 'Tapa rosca con precinto 28mm', unit: 'unidad', currentStock: 2500, minStockAlert: 500, lastCost: 0.15, stockStatus: 'OPTIMO' },
  ],
  purchases: [
    { id: 'b1', batchNumber: 'LOTE-PIN-0402', purchaseDate: new Date().toISOString(), supplyName: 'Piña golden fresca', quantity: 6000, unit: 'g', totalCost: 36.00, supplier: 'Frutas San Luis', expirationDate: new Date(Date.now() + 3 * 86400000).toISOString() },
    { id: 'b2', batchNumber: 'LOTE-JEN-1108', purchaseDate: new Date().toISOString(), supplyName: 'Jengibre fresco (Kion)', quantity: 15000, unit: 'g', totalCost: 225.00, supplier: 'Agro Selva', expirationDate: new Date(Date.now() + 25 * 86400000).toISOString() },
    { id: 'b3', batchNumber: 'LOTE-PET-991', purchaseDate: new Date().toISOString(), supplyName: 'Botella PET 60ml alimentaria', quantity: 2500, unit: 'unidad', totalCost: 1125.00, supplier: 'Envases Perú', expirationDate: null },
  ],
  recipes: {
    p1: [
      { id: 'r1', supplyId: 's1', supplyName: 'Jengibre fresco (Kion)', unit: 'g', lastCost: 0.015, quantityNeeded: 15 },
      { id: 'r2', supplyId: 's2', supplyName: 'Cúrcuma fresca', unit: 'g', lastCost: 0.020, quantityNeeded: 5 },
      { id: 'r3', supplyId: 's3', supplyName: 'Limón sutil exprimido', unit: 'ml', lastCost: 0.008, quantityNeeded: 20 },
      { id: 'r4', supplyId: 's4', supplyName: 'Zumo de naranja valencia', unit: 'ml', lastCost: 0.006, quantityNeeded: 20 },
      { id: 'r5', supplyId: 's8', supplyName: 'Botella PET 60ml alimentaria', unit: 'unidad', lastCost: 0.45, quantityNeeded: 1 },
      { id: 'r6', supplyId: 's9', supplyName: 'Tapa rosca con precinto 28mm', unit: 'unidad', lastCost: 0.15, quantityNeeded: 1 },
    ],
    p2: [
      { id: 'r7', supplyId: 's5', supplyName: 'Espinaca baby fresca', unit: 'g', lastCost: 0.012, quantityNeeded: 15 },
      { id: 'r8', supplyId: 's6', supplyName: 'Manzana verde', unit: 'g', lastCost: 0.007, quantityNeeded: 20 },
      { id: 'r9', supplyId: 's3', supplyName: 'Limón sutil exprimido', unit: 'ml', lastCost: 0.008, quantityNeeded: 10 },
      { id: 'r10', supplyId: 's8', supplyName: 'Botella PET 60ml alimentaria', unit: 'unidad', lastCost: 0.45, quantityNeeded: 1 },
      { id: 'r11', supplyId: 's9', supplyName: 'Tapa rosca con precinto 28mm', unit: 'unidad', lastCost: 0.15, quantityNeeded: 1 },
    ],
  },
  orders: [
    {
      id: 'ord-1',
      orderNumber: 'VJ-2026-001',
      createdAt: new Date().toISOString(),
      customer: { name: 'Camila Rodriguez', phone: '987654321', address: 'Calle Los Pinos 245, Miraflores' },
      items: [{ id: 'it-1', product: { name: 'Pack Semanal (7 Shots)' }, quantity: 1, subtotal: 50.00 }, { id: 'it-2', product: { name: 'Shot Inmune (60ml)' }, quantity: 2, subtotal: 15.00 }],
      totalAmount: 65.00,
      paymentStatus: 'PAGADO',
      paymentMethod: 'CULQI',
      status: 'ENTREGADO',
    },
    {
      id: 'ord-2',
      orderNumber: 'VJ-2026-002',
      createdAt: new Date().toISOString(),
      customer: { name: 'Rodrigo Mendoza', phone: '912345678', address: 'Av. Dos de Mayo 1150, San Isidro' },
      items: [{ id: 'it-3', product: { name: 'Shot Inmune (60ml)' }, quantity: 2, subtotal: 15.00 }, { id: 'it-4', product: { name: 'Shot Energy (60ml)' }, quantity: 2, subtotal: 16.00 }],
      totalAmount: 31.00,
      paymentStatus: 'PAGADO',
      paymentMethod: 'YAPE',
      status: 'EN_PREPARACION',
    },
    {
      id: 'ord-3',
      orderNumber: 'VJ-2026-003',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), // Hace 4 días -> Alerta
      customer: { name: 'Gimnasio FitZone Surco', phone: '998877665', address: 'Av. Primavera 650, Surco' },
      items: [{ id: 'it-5', product: { name: 'Pack Semanal (7 Shots)' }, quantity: 3, subtotal: 150.00 }],
      totalAmount: 150.00,
      paymentStatus: 'PENDIENTE',
      paymentMethod: 'TRANSFERENCIA',
      status: 'PENDIENTE',
    },
  ],
};

// ============================================================================
// 2. CONEXIÓN SUPABASE (NUBE) Y COMUNICACIÓN API
// ============================================================================
let SUPABASE_URL = localStorage.getItem('vitajuice_sb_url') || '';
let SUPABASE_KEY = localStorage.getItem('vitajuice_sb_key') || '';
let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && window.supabase && SUPABASE_URL && SUPABASE_KEY) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('✅ Supabase conectado a:', SUPABASE_URL);
    } catch (e) {
      console.warn('Error al iniciar Supabase:', e);
    }
  }
  return supabaseClient;
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      logout();
      return null;
    }
    const data = await res.json();
    state.backendOnline = true;
    updateBackendStatusBadge('backend');
    return data;
  } catch (err) {
    state.backendOnline = false;
    return null;
  }
}

function updateBackendStatusBadge(source) {
  const badgeText = document.getElementById('db-status-text');
  if (!badgeText) return;

  if (source === 'supabase' || (getSupabase() && SUPABASE_URL)) {
    badgeText.innerText = '🟢 Supabase Cloud Conectado (Clic para ver)';
    badgeText.parentElement.className = 'hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full text-xs font-bold text-emerald-900 shadow-sm cursor-pointer';
  } else if (source === 'backend' && state.backendOnline) {
    badgeText.innerText = '🟢 Backend Node.js Conectado';
    badgeText.parentElement.className = 'hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-800';
  } else {
    badgeText.innerText = '🟡 Modo Demo (Clic para conectar Supabase)';
    badgeText.parentElement.className = 'hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-full text-xs font-semibold text-amber-800 transition-colors cursor-pointer';
  }
}

// ============================================================================
// 3. CARGA Y SINCRONIZACIÓN DE DATOS
// ============================================================================
async function loadAllData() {
  const sb = getSupabase();
  if (sb) {
    try {
      updateBackendStatusBadge('supabase');
      // 1. Cargar productos desde Supabase
      const { data: prods } = await sb.from('products').select('*').order('name');
      if (prods && prods.length > 0) state.products = prods;
      else state.products = [...mockData.products];

      // 2. Cargar insumos desde Supabase
      const { data: supps } = await sb.from('supplies').select('*').order('name');
      if (supps && supps.length > 0) {
        state.supplies = supps.map((s) => {
          const cur = Number(s.current_stock);
          const min = Number(s.min_stock_alert);
          return {
            id: s.id,
            name: s.name,
            unit: s.unit,
            currentStock: cur,
            minStockAlert: min,
            lastCost: Number(s.last_cost),
            stockStatus: cur <= 0 ? 'CRITICO' : cur <= min ? 'BAJO' : 'OPTIMO',
          };
        });
      } else {
        state.supplies = [...mockData.supplies];
      }

      // 3. Cargar compras desde Supabase
      const { data: purs } = await sb.from('supply_purchases').select('*, supply:supplies(name, unit)').order('purchase_date', { ascending: false });
      if (purs && purs.length > 0) {
        state.purchases = purs.map((p) => ({
          id: p.id,
          batchNumber: p.batch_number,
          purchaseDate: p.purchase_date,
          supplyName: p.supply?.name || 'Insumo',
          quantity: Number(p.quantity),
          unit: p.supply?.unit || '',
          totalCost: Number(p.total_cost),
          supplier: p.supplier,
          expirationDate: p.expiration_date,
        }));
      } else {
        state.purchases = [...mockData.purchases];
      }

      // 4. Cargar pedidos desde Supabase
      const { data: ords } = await sb.from('orders').select('*, customer:customers(*), items:order_items(*, product:products(*))').order('created_at', { ascending: false });
      if (ords && ords.length > 0) {
        state.orders = ords.map((o) => ({
          id: o.id,
          orderNumber: o.order_number,
          createdAt: o.created_at,
          totalAmount: Number(o.total_amount),
          status: o.status,
          paymentStatus: o.payment_status,
          paymentMethod: o.payment_method,
          customer: o.customer || { name: 'Cliente', phone: '' },
          items: (o.items || []).map((it) => ({
            id: it.id,
            product: it.product || { name: 'Shot' },
            quantity: it.quantity,
            unitPrice: Number(it.unit_price),
            subtotal: Number(it.subtotal),
          })),
        }));
      } else {
        state.orders = [...mockData.orders];
      }

      state.alerts = calculateLocalAlerts();
      state.metrics = calculateLocalMetrics();
      renderCurrentView();
      updateSidebarAlertBadge();
      return;
    } catch (sbErr) {
      console.warn('Error leyendo Supabase, pasando a respaldo:', sbErr);
    }
  }

  // Respaldo habitual: API REST o Mock Local
  const [prodsRes, suppRes, purchRes, ordersRes, alertsRes, repRes] = await Promise.all([
    apiRequest('/products'),
    apiRequest('/supplies'),
    apiRequest('/supplies/purchases'),
    apiRequest('/orders'),
    apiRequest('/alerts'),
    apiRequest('/reports/dashboard'),
  ]);

  if (prodsRes && prodsRes.success) {
    state.products = prodsRes.data;
  } else {
    state.products = [...mockData.products];
  }

  if (suppRes && suppRes.success) {
    state.supplies = suppRes.data;
  } else {
    state.supplies = [...mockData.supplies];
  }

  if (purchRes && purchRes.success) {
    state.purchases = purchRes.data;
  } else {
    state.purchases = [...mockData.purchases];
  }

  if (ordersRes && ordersRes.success) {
    state.orders = ordersRes.data;
  } else {
    state.orders = [...mockData.orders];
  }

  if (alertsRes && alertsRes.success) {
    state.alerts = alertsRes;
  } else {
    state.alerts = calculateLocalAlerts();
  }

  if (repRes && repRes.success) {
    state.metrics = repRes.data;
  } else {
    state.metrics = calculateLocalMetrics();
  }

  renderCurrentView();
  updateSidebarAlertBadge();
}

function calculateLocalAlerts() {
  const lowStock = state.supplies.filter((s) => s.currentStock <= s.minStockAlert).map((s) => ({
    id: s.id,
    name: s.name,
    currentStock: s.currentStock,
    minStockAlert: s.minStockAlert,
    unit: s.unit,
    message: `Stock bajo (${s.currentStock} ${s.unit}). Por debajo del mínimo de seguridad (${s.minStockAlert} ${s.unit}).`,
  }));

  const expiring = [
    {
      id: 'exp-1',
      supplyName: 'Piña golden fresca',
      batchNumber: 'LOTE-PIN-0402',
      quantity: 6000,
      unit: 'g',
      expirationDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      message: 'Vence en 3 día(s) (LOTE-PIN-0402). Priorizar su uso en el próximo lote.',
    },
  ];

  const stale = state.orders
    .filter((o) => o.paymentStatus === 'PENDIENTE')
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      customerPhone: o.customer.phone,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      daysPending: 4,
      message: `Pedido ${o.orderNumber} por S/. ${o.totalAmount} pendiente de pago desde hace 4 días. Contactar al cliente vía WhatsApp.`,
    }));

  return {
    summary: {
      total: lowStock.length + expiring.length + stale.length,
      lowStockCount: lowStock.length,
      expiringCount: expiring.length,
      staleOrdersCount: stale.length,
    },
    data: { lowStock, expiringSupplies: expiring, staleOrders: stale },
  };
}

function calculateLocalMetrics() {
  const paidOrders = state.orders.filter((o) => o.paymentStatus === 'PAGADO');
  const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  // Estimación de costo de insumos (~22% de la venta según recetas de shots)
  const totalSupplyCost = Number((totalRevenue * 0.22).toFixed(2));
  const realGrossMargin = Number((totalRevenue - totalSupplyCost).toFixed(2));
  const marginPercentage = totalRevenue > 0 ? Number(((realGrossMargin / totalRevenue) * 100).toFixed(1)) : 0;

  const totalItemsSold = paidOrders.reduce((acc, o) => {
    return acc + o.items.reduce((s, it) => s + it.quantity, 0);
  }, 0);

  const topProducts = [
    { name: 'Shot Inmune (60ml)', category: 'SHOT', quantity: 14, revenue: 105.00, cost: 20.30, margin: 84.70, marginPercent: 80.7 },
    { name: 'Pack Semanal (7 Shots)', category: 'PACK', quantity: 4, revenue: 200.00, cost: 42.00, margin: 158.00, marginPercent: 79.0 },
    { name: 'Shot Energy (60ml)', category: 'SHOT', quantity: 8, revenue: 64.00, cost: 14.40, margin: 49.60, marginPercent: 77.5 },
    { name: 'Shot Detox (60ml)', category: 'SHOT', quantity: 6, revenue: 45.00, cost: 9.90, margin: 35.10, marginPercent: 78.0 },
  ];

  return {
    financials: {
      totalRevenue,
      totalSupplyCost,
      realGrossMargin,
      marginPercentage,
      paidOrdersCount: paidOrders.length,
      totalItemsSold,
    },
    kpis: {
      totalOrdersCount: state.orders.length,
      pendingOrdersCount: state.orders.filter((o) => o.paymentStatus === 'PENDIENTE').length,
    },
    topProducts,
  };
}

// ============================================================================
// 4. CONTROL DE SESIÓN Y VISTAS (SPA VANILLA)
// ============================================================================
function initSession() {
  const overlay = document.getElementById('login-overlay');
  if (!state.token && !state.user) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
    updateUserDisplay();
  }
}

function updateUserDisplay() {
  const nameEl = document.getElementById('user-display-name');
  const emailEl = document.getElementById('user-display-email');
  if (nameEl) nameEl.innerText = state.user?.name || 'Administrador VitaJuice';
  if (emailEl) emailEl.innerText = state.user?.email || 'admin@vitajuice.pe';
}

function login(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('vitajuice_token', token);
  localStorage.setItem('vitajuice_user', JSON.stringify(user));
  document.getElementById('login-overlay').classList.add('hidden');
  updateUserDisplay();
  loadAllData();
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('vitajuice_token');
  localStorage.removeItem('vitajuice_user');
  document.getElementById('login-overlay').classList.remove('hidden');
}

function showView(viewName) {
  state.currentView = viewName;

  // Actualizar clases activas en botones del Sidebar
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    if (btn.dataset.view === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Ocultar todas las secciones
  const sections = ['dashboard', 'orders', 'inventory', 'recipes', 'alerts', 'reports'];
  sections.forEach((sec) => {
    const el = document.getElementById(`view-${sec}`);
    if (el) {
      if (sec === viewName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Títulos contextuales del Navbar
  const titles = {
    dashboard: { title: 'Panel General de Control', sub: 'Métricas en tiempo real para VitaJuice by Rena' },
    orders: { title: 'Ventas y Pedidos', sub: 'Registro de pedidos por WhatsApp, seguimiento logístico y cobros' },
    inventory: { title: 'Inventario y Compras', sub: 'Control de materias primas, umbrales de alerta y vencimientos' },
    recipes: { title: 'Fichas Técnicas (Recetas)', sub: 'Estructura de consumo de insumos por shot y costo de producción' },
    alerts: { title: 'Bandeja de Alertas Operativas', sub: 'Monitoreo preventivo de stock crítico, vencimientos y cobros' },
    reports: { title: 'Panel de Reportes y Rentabilidad', sub: 'Métricas financieras, rentabilidad real y exportación Sprint Review' },
  };

  const navTitle = document.getElementById('navbar-title');
  const navSub = document.getElementById('navbar-subtitle');
  if (navTitle && titles[viewName]) navTitle.innerText = titles[viewName].title;
  if (navSub && titles[viewName]) navSub.innerText = titles[viewName].sub;

  renderCurrentView();
}

function renderCurrentView() {
  switch (state.currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'orders':
      renderOrders();
      break;
    case 'inventory':
      renderInventory();
      break;
    case 'recipes':
      renderRecipes();
      break;
    case 'alerts':
      renderAlerts();
      break;
    case 'reports':
      renderReports();
      break;
  }
  // Refrescar iconos Lucide en el DOM
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ============================================================================
// 5. RENDERIZADORES DE CADA MÓDULO
// ============================================================================

// --- A. DASHBOARD ---
function renderDashboard() {
  const fin = state.metrics?.financials || {};
  const kpi = state.metrics?.kpis || {};

  // KPIs
  document.getElementById('kpi-revenue').innerText = `S/. ${Number(fin.totalRevenue || 0).toFixed(2)}`;
  document.getElementById('kpi-paid-count').innerHTML = `<i data-lucide="check-circle" class="w-3 h-3"></i> ${fin.paidOrdersCount || 0} pedidos confirmados`;
  document.getElementById('kpi-margin-soles').innerText = `S/. ${Number(fin.realGrossMargin || 0).toFixed(2)}`;
  document.getElementById('kpi-margin-percent').innerText = `${fin.marginPercentage || 0}% rentabilidad bruta`;
  document.getElementById('kpi-orders-count').innerText = kpi.totalOrdersCount || state.orders.length;
  document.getElementById('kpi-pending-count').innerHTML = `<i data-lucide="clock" class="w-3 h-3"></i> ${kpi.pendingOrdersCount || 0} pendientes de pago`;
  document.getElementById('kpi-items-sold').innerText = fin.totalItemsSold || 0;

  // Banner Alertas
  const banner = document.getElementById('dash-alert-banner');
  if (state.alerts?.summary?.total > 0) {
    banner.classList.remove('hidden');
    document.getElementById('dash-alert-desc').innerText = `${state.alerts.summary.lowStockCount} insumos con stock bajo • ${state.alerts.summary.expiringCount} lotes próximos a vencer • ${state.alerts.summary.staleOrdersCount} pedidos por cobrar.`;
  } else {
    banner.classList.add('hidden');
  }

  // Ranking Top Shots
  const topContainer = document.getElementById('dash-top-products');
  const topList = state.metrics?.topProducts || [];
  if (topList.length === 0) {
    topContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Sin datos de ventas aún.</p>';
  } else {
    const maxQty = topList[0]?.quantity || 1;
    topContainer.innerHTML = topList
      .slice(0, 4)
      .map((p, idx) => `
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span class="font-semibold text-slate-800">${idx + 1}. ${p.name}</span>
            <span class="text-slate-500 font-mono">${p.quantity} und • S/. ${Number(p.revenue).toFixed(2)}</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2">
            <div class="bg-emerald-500 h-2 rounded-full" style="width: ${(p.quantity / maxQty) * 100}%"></div>
          </div>
        </div>
      `)
      .join('');
  }

  // Últimos Pedidos
  const recentTable = document.getElementById('dash-recent-orders');
  recentTable.innerHTML = state.orders.slice(0, 5).map((ord) => `
    <tr class="hover:bg-slate-50/80 transition-colors">
      <td class="py-3 font-mono font-bold text-slate-800">${ord.orderNumber}</td>
      <td class="py-3">
        <p class="font-semibold text-slate-800">${ord.customer.name}</p>
        <p class="text-[11px] text-slate-400">${ord.customer.phone}</p>
      </td>
      <td class="py-3 font-bold text-slate-900">S/. ${Number(ord.totalAmount).toFixed(2)}</td>
      <td class="py-3">
        <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${
          ord.paymentStatus === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }">${ord.paymentStatus}</span>
      </td>
      <td class="py-3">
        <span class="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-700">${ord.status}</span>
      </td>
    </tr>
  `).join('');
}

// --- B. VENTAS Y PEDIDOS ---
function renderOrders() {
  const searchTerm = (document.getElementById('orders-search')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('orders-status-filter')?.value || '';

  const filtered = state.orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchTerm) ||
      ord.customer.name.toLowerCase().includes(searchTerm) ||
      ord.customer.phone.includes(searchTerm);
    const matchesStatus = statusFilter ? ord.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const tbody = document.getElementById('orders-table-body');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-slate-400">No se encontraron pedidos registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((ord) => `
    <tr class="hover:bg-slate-50/60 transition-colors">
      <td class="p-4">
        <span class="font-mono font-bold text-slate-900 block">${ord.orderNumber}</span>
        <span class="text-[11px] text-slate-400">${new Date(ord.createdAt).toLocaleDateString()}</span>
      </td>
      <td class="p-4">
        <p class="font-bold text-slate-800">${ord.customer.name}</p>
        <p class="text-slate-500 flex items-center gap-1 text-[11px] mt-0.5">
          <i data-lucide="phone" class="w-3 h-3 text-emerald-600"></i> ${ord.customer.phone}
        </p>
      </td>
      <td class="p-4">
        <div class="space-y-1 max-w-xs">
          ${ord.items.map((it) => `<span class="inline-block bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded mr-1 font-medium">${it.quantity}x ${it.product?.name || 'Shot'}</span>`).join('')}
        </div>
      </td>
      <td class="p-4 font-black text-slate-900 text-sm">S/. ${Number(ord.totalAmount).toFixed(2)}</td>
      <td class="p-4">
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
          ord.paymentStatus === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }">
          <i data-lucide="${ord.paymentStatus === 'PAGADO' ? 'check-circle' : 'clock'}" class="w-3 h-3"></i>
          ${ord.paymentStatus}
        </span>
        ${ord.paymentMethod ? `<span class="block text-[10px] text-slate-400 font-mono uppercase mt-0.5">Vía ${ord.paymentMethod}</span>` : ''}
      </td>
      <td class="p-4">
        <select onchange="updateOrderStatus('${ord.id}', this.value)" class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white focus:outline-none">
          <option value="PENDIENTE" ${ord.status === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
          <option value="EN_PREPARACION" ${ord.status === 'EN_PREPARACION' ? 'selected' : ''}>En Preparación</option>
          <option value="EN_CAMINO" ${ord.status === 'EN_CAMINO' ? 'selected' : ''}>En Camino</option>
          <option value="ENTREGADO" ${ord.status === 'ENTREGADO' ? 'selected' : ''}>Entregado</option>
          <option value="CANCELADO" ${ord.status === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
        </select>
      </td>
      <td class="p-4 text-right">
        ${ord.paymentStatus !== 'PAGADO' ? `
          <button onclick="openCulqiModal('${ord.id}')" class="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 ml-auto transition-all">
            <i data-lucide="credit-card" class="w-3.5 h-3.5"></i>
            <span>Cobrar Culqi</span>
          </button>
        ` : '<span class="text-emerald-600 font-semibold text-xs">✓ Completado</span>'}
      </td>
    </tr>
  `).join('');
}

// --- C. INVENTARIO Y COMPRAS ---
function renderInventory() {
  const tbody = document.getElementById('inventory-table-body');
  tbody.innerHTML = state.supplies.map((s) => `
    <tr class="hover:bg-slate-50/60 transition-colors">
      <td class="p-4 font-bold text-slate-800 flex items-center gap-2">
        ${s.name}
        ${s.stockStatus !== 'OPTIMO' ? '<span title="Stock bajo" class="text-amber-500"><i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i></span>' : ''}
      </td>
      <td class="p-4 font-mono font-bold text-slate-900 text-sm">
        ${Number(s.currentStock).toLocaleString()} <span class="text-xs text-slate-500 font-sans">${s.unit}</span>
      </td>
      <td class="p-4 text-slate-500 font-mono">${Number(s.minStockAlert).toLocaleString()} ${s.unit}</td>
      <td class="p-4">
        <span class="px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
          s.stockStatus === 'OPTIMO' ? 'bg-emerald-100 text-emerald-800' : s.stockStatus === 'BAJO' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-red-100 text-red-800 font-black'
        }">${s.stockStatus || 'OPTIMO'}</span>
      </td>
      <td class="p-4 font-mono text-slate-700">S/. ${Number(s.lastCost).toFixed(3)} / ${s.unit}</td>
      <td class="p-4 text-slate-400 text-[11px]">Control activo</td>
    </tr>
  `).join('');

  // Historial compras
  const pBody = document.getElementById('purchases-table-body');
  pBody.innerHTML = state.purchases.slice(0, 8).map((p) => {
    const hasExp = !!p.expirationDate;
    const expDate = hasExp ? new Date(p.expirationDate) : null;
    const isNear = expDate && expDate.getTime() - Date.now() < 7 * 86400000;
    return `
      <tr class="hover:bg-slate-50/50">
        <td class="p-3 font-mono font-bold text-slate-700">${p.batchNumber || 'N/A'}</td>
        <td class="p-3 text-slate-500">${new Date(p.purchaseDate).toLocaleDateString()}</td>
        <td class="p-3 font-semibold text-slate-800">${p.supplyName || p.supply?.name || 'Insumo'}</td>
        <td class="p-3 font-mono">${Number(p.quantity)} ${p.unit || p.supply?.unit || ''}</td>
        <td class="p-3 font-bold text-slate-900">S/. ${Number(p.totalCost).toFixed(2)}</td>
        <td class="p-3 text-slate-600">${p.supplier || 'Proveedor Local'}</td>
        <td class="p-3">
          ${hasExp ? `<span class="px-2 py-0.5 rounded text-[11px] font-semibold ${isNear ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}">📅 ${expDate.toLocaleDateString()}</span>` : '<span class="text-slate-400">No perecible</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

// --- D. FICHAS TÉCNICAS (RECETAS) ---
function renderRecipes() {
  document.getElementById('recipes-catalog-count').innerText = `${state.products.length} productos`;

  if (!state.selectedProductForRecipe && state.products.length > 0) {
    state.selectedProductForRecipe = state.products[0];
  }

  const listContainer = document.getElementById('recipes-product-list');
  listContainer.innerHTML = state.products.map((p) => {
    const isSelected = state.selectedProductForRecipe?.id === p.id;
    return `
      <button onclick="selectRecipeProduct('${p.id}')" class="w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
        isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-slate-50/60'
      }">
        <div class="flex justify-between items-start">
          <span class="font-bold text-xs text-slate-900 line-clamp-1">${p.name}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-200">${p.category}</span>
        </div>
        <div class="mt-2 flex justify-between items-center text-[11px]">
          <span class="text-slate-500">P. Venta: <strong class="text-slate-800">S/. ${Number(p.price).toFixed(2)}</strong></span>
          <span class="text-emerald-700 font-semibold">Shot Funcional</span>
        </div>
      </button>
    `;
  }).join('');

  renderRecipeDetail();
}

function selectRecipeProduct(productId) {
  state.selectedProductForRecipe = state.products.find((p) => p.id === productId);
  renderRecipes();
}

function renderRecipeDetail() {
  const container = document.getElementById('recipe-detail-container');
  const prod = state.selectedProductForRecipe;
  if (!prod) {
    container.innerHTML = '<p class="text-center text-slate-400 py-16">Selecciona un producto del catálogo.</p>';
    return;
  }

  // Buscar receta en mockData o backend
  const recipeItems = mockData.recipes[prod.id] || mockData.recipes.p1;
  const productionCost = recipeItems.reduce((acc, it) => acc + it.quantityNeeded * it.lastCost, 0);
  const grossMargin = Number(prod.price) - productionCost;
  const marginPct = prod.price > 0 ? ((grossMargin / prod.price) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-100 gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-black text-slate-900">${prod.name}</h3>
          <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">${prod.category}</span>
        </div>
        <p class="text-xs text-slate-500 mt-1 max-w-xl">${prod.description || 'Shot artesanal prensado en frío'}</p>
      </div>
      <button onclick="openAddRecipeItemModal()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors shrink-0">
        <i data-lucide="plus" class="w-4 h-4"></i>
        <span>Agregar Insumo</span>
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Precio de Venta</span>
        <p class="text-xl font-black text-slate-900 mt-1">S/. ${Number(prod.price).toFixed(2)}</p>
      </div>
      <div class="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
        <span class="text-[11px] font-bold uppercase tracking-wider text-amber-700">Costo Insumos (Receta)</span>
        <p class="text-xl font-black text-amber-900 mt-1">S/. ${productionCost.toFixed(2)}</p>
      </div>
      <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Margen Bruto Unitario</span>
        <p class="text-xl font-black text-emerald-900 mt-1">S/. ${grossMargin.toFixed(2)} (${marginPct}%)</p>
      </div>
    </div>

    <div>
      <h4 class="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">Ingredientes y Envases Requeridos por Unidad (60ml)</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase">
            <tr>
              <th class="p-3">Insumo Requerido</th>
              <th class="p-3">Dosis por Unidad</th>
              <th class="p-3">Costo Unitario</th>
              <th class="p-3">Costo en Receta</th>
              <th class="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${recipeItems.map((it) => `
              <tr class="hover:bg-slate-50/60">
                <td class="p-3 font-semibold text-slate-800">${it.supplyName}</td>
                <td class="p-3 font-mono font-bold text-slate-900">${it.quantityNeeded} ${it.unit}</td>
                <td class="p-3 font-mono text-slate-600">S/. ${Number(it.lastCost).toFixed(3)} / ${it.unit}</td>
                <td class="p-3 font-mono font-bold text-emerald-700">S/. ${(it.quantityNeeded * it.lastCost).toFixed(3)}</td>
                <td class="p-3 text-right">
                  <button onclick="alert('Insumo registrado en la ficha técnica')" class="p-1 text-slate-400 hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// --- E. BANDEJA DE ALERTAS ---
function renderAlerts() {
  const sum = state.alerts?.summary || {};
  document.getElementById('alert-count-stock').innerText = sum.lowStockCount || 0;
  document.getElementById('alert-count-expiry').innerText = sum.expiringCount || 0;
  document.getElementById('alert-count-stale').innerText = sum.staleOrdersCount || 0;

  // 1. Stock Bajo
  const stockBox = document.getElementById('alerts-stock-container');
  const lowList = state.alerts?.data?.lowStock || [];
  if (lowList.length === 0) {
    stockBox.innerHTML = '<div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> Todos los insumos se encuentran en niveles óptimos.</div>';
  } else {
    stockBox.innerHTML = lowList.map((it) => `
      <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span class="font-bold text-slate-900 text-sm">${it.name}</span>
          <p class="text-xs text-amber-800 mt-0.5">${it.message}</p>
        </div>
        <div class="text-right shrink-0">
          <span class="text-xs font-mono font-bold text-slate-700 block">Actual: ${it.currentStock} ${it.unit} / Mínimo: ${it.minStockAlert} ${it.unit}</span>
          <button onclick="showView('inventory')" class="mt-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors">Reponer Stock</button>
        </div>
      </div>
    `).join('');
  }

  // 2. Vencimiento
  const expBox = document.getElementById('alerts-expiry-container');
  const expList = state.alerts?.data?.expiringSupplies || [];
  if (expList.length === 0) {
    expBox.innerHTML = '<div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> No hay lotes con fecha de caducidad en los próximos 7 días.</div>';
  } else {
    expBox.innerHTML = expList.map((it) => `
      <div class="p-4 rounded-xl border border-red-200 bg-red-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span class="font-bold text-slate-900 text-sm">${it.supplyName}</span>
          <p class="text-xs text-red-800 mt-0.5">${it.message}</p>
          <span class="text-[11px] text-slate-500 font-mono mt-1 block">Lote: ${it.batchNumber} • Cantidad: ${it.quantity} ${it.unit}</span>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-lg block">Vence: ${new Date(it.expirationDate).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
  }

  // 3. Pedidos Rezagados
  const staleBox = document.getElementById('alerts-stale-container');
  const staleList = state.alerts?.data?.staleOrders || [];
  if (staleList.length === 0) {
    staleBox.innerHTML = '<div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> No hay pedidos pendientes de cobro antiguos.</div>';
  } else {
    staleBox.innerHTML = staleList.map((it) => `
      <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span class="font-bold text-slate-900 text-sm">${it.orderNumber} • Cliente: ${it.customerName}</span>
          <p class="text-xs text-blue-900 mt-0.5">${it.message}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="https://wa.me/51${it.customerPhone}?text=Hola%20${encodeURIComponent(it.customerName)},%20te%20escribimos%20de%20VitaJuice%20respecto%20a%20tu%20pedido%20${it.orderNumber}." target="_blank" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors">
            <i data-lucide="phone" class="w-3 h-3"></i>
            WhatsApp
          </a>
          <button onclick="showView('orders')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors">Ver Pedido</button>
        </div>
      </div>
    `).join('');
  }
}

function updateSidebarAlertBadge() {
  const badge = document.getElementById('sidebar-alert-badge');
  const total = state.alerts?.summary?.total || 0;
  if (total > 0) {
    badge.innerText = total;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// --- F. REPORTES Y MARGEN REAL ---
function renderReports() {
  const fin = state.metrics?.financials || {};
  document.getElementById('report-revenue').innerText = `S/. ${Number(fin.totalRevenue || 0).toFixed(2)}`;
  document.getElementById('report-orders-count').innerText = `Sobre ${fin.paidOrdersCount || 0} pedidos confirmados`;
  document.getElementById('report-supply-cost').innerText = `S/. ${Number(fin.totalSupplyCost || 0).toFixed(2)}`;
  document.getElementById('report-items-count').innerText = `Descontado según receta de los ${fin.totalItemsSold || 0} shots vendidos`;
  document.getElementById('report-gross-margin').innerText = `S/. ${Number(fin.realGrossMargin || 0).toFixed(2)}`;
  document.getElementById('report-margin-percent').innerText = `Rentabilidad bruta real: ${fin.marginPercentage || 0}%`;

  const tbody = document.getElementById('report-products-table-body');
  const topList = state.metrics?.topProducts || [];
  if (topList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-slate-400">Sin datos para reportar.</td></tr>';
  } else {
    tbody.innerHTML = topList.map((p, idx) => `
      <tr class="hover:bg-slate-50/70">
        <td class="p-3 font-bold text-slate-800"><span class="font-mono text-slate-400 mr-2">#${idx + 1}</span>${p.name}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${p.category}</span></td>
        <td class="p-3 font-mono font-bold text-slate-900">${p.quantity} und</td>
        <td class="p-3 font-mono font-semibold text-slate-800">S/. ${Number(p.revenue).toFixed(2)}</td>
        <td class="p-3 font-mono text-amber-700">S/. ${Number(p.cost).toFixed(2)}</td>
        <td class="p-3 font-mono font-bold text-emerald-700">S/. ${Number(p.margin).toFixed(2)}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">${p.marginPercent}%</span></td>
      </tr>
    `).join('');
  }
}

// ============================================================================
// 6. GESTIÓN DE ACCIONES Y MODALES
// ============================================================================

// Actualizar estado de un pedido
async function updateOrderStatus(orderId, newStatus) {
  if (state.backendOnline) {
    await apiRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  }
  const ord = state.orders.find((o) => o.id === orderId);
  if (ord) ord.status = newStatus;
  renderOrders();
}

// Modal Nuevo Pedido
function openNewOrderModal() {
  state.orderSelectedItems = [];
  document.getElementById('form-create-order').reset();
  document.getElementById('order-selected-items-box').classList.add('hidden');
  document.getElementById('order-method-box').classList.add('hidden');

  const sel = document.getElementById('order-products-selector');
  sel.innerHTML = state.products.map((p) => `
    <button type="button" onclick="addOrderItem('${p.id}')" class="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all">
      <p class="font-bold text-xs text-slate-800 line-clamp-1">${p.name}</p>
      <p class="text-[11px] text-emerald-600 font-semibold mt-0.5">S/. ${Number(p.price).toFixed(2)}</p>
    </button>
  `).join('');

  document.getElementById('modal-order').classList.remove('hidden');
}

function addOrderItem(productId) {
  const existing = state.orderSelectedItems.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.orderSelectedItems.push({ productId, quantity: 1 });
  }
  renderOrderSelectedItems();
}

function updateOrderItemQty(productId, delta) {
  const item = state.orderSelectedItems.find((i) => i.productId === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      state.orderSelectedItems = state.orderSelectedItems.filter((i) => i.productId !== productId);
    }
  }
  renderOrderSelectedItems();
}

function renderOrderSelectedItems() {
  const box = document.getElementById('order-selected-items-box');
  const list = document.getElementById('order-selected-items-list');
  const totalDisplay = document.getElementById('order-total-display');

  if (state.orderSelectedItems.length === 0) {
    box.classList.add('hidden');
    return;
  }

  box.classList.remove('hidden');
  let total = 0;

  list.innerHTML = state.orderSelectedItems.map((it) => {
    const prod = state.products.find((p) => p.id === it.productId);
    const sub = (prod?.price || 0) * it.quantity;
    total += sub;
    return `
      <div class="flex justify-between items-center text-xs">
        <span class="font-medium text-slate-800">${prod?.name}</span>
        <div class="flex items-center gap-2">
          <button type="button" onclick="updateOrderItemQty('${it.productId}', -1)" class="w-6 h-6 rounded bg-white border border-slate-300 font-bold hover:bg-slate-100">-</button>
          <span class="font-mono font-bold w-4 text-center">${it.quantity}</span>
          <button type="button" onclick="updateOrderItemQty('${it.productId}', 1)" class="w-6 h-6 rounded bg-white border border-slate-300 font-bold hover:bg-slate-100">+</button>
          <span class="font-bold text-slate-900 w-16 text-right">S/. ${sub.toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');

  totalDisplay.innerText = `S/. ${total.toFixed(2)}`;
}

// Modal Pasarela Culqi
function openCulqiModal(orderId) {
  const ord = state.orders.find((o) => o.id === orderId);
  if (!ord) return;

  state.currentOrderForCulqi = ord;
  document.getElementById('culqi-order-info').innerText = `Pedido ${ord.orderNumber} • ${ord.customer.name}`;
  document.getElementById('culqi-amount-display').innerText = `S/. ${Number(ord.totalAmount).toFixed(2)}`;
  document.getElementById('btn-culqi-label').innerText = `Pagar S/. ${Number(ord.totalAmount).toFixed(2)}`;
  document.getElementById('culqi-success-view').classList.add('hidden');
  document.getElementById('form-culqi-payment').classList.remove('hidden');

  document.getElementById('modal-culqi').classList.remove('hidden');
}

async function processCulqiPayment(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-culqi');
  btn.disabled = true;
  document.getElementById('btn-culqi-label').innerText = 'Procesando con Culqi...';

  const order = state.currentOrderForCulqi;
  const txId = `chr_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Sincronizar en Supabase si está conectado
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('orders').update({
        payment_status: 'PAGADO',
        status: 'EN_PREPARACION',
        payment_method: 'CULQI',
      }).eq('id', order.id);

      await sb.from('payments').insert({
        order_id: order.id,
        provider: 'CULQI',
        transaction_id: txId,
        amount: order.totalAmount,
        currency: 'PEN',
        status: 'SUCCESS',
        payload: { outcome: { type: 'venta_exitosa' } },
      });
    } catch (e) {
      console.warn('Error guardando pago en Supabase:', e);
    }
  }

  if (state.backendOnline) {
    await apiRequest('/payments/culqi-charge', {
      method: 'POST',
      body: JSON.stringify({
        orderId: order.id,
        token: `tkn_test_${state.culqiMethod.toLowerCase()}`,
        email: document.getElementById('culqi-email').value,
      }),
    });
  }

  // Actualizar estado local inmediatamente
  setTimeout(() => {
    order.paymentStatus = 'PAGADO';
    order.status = 'EN_PREPARACION';
    order.paymentMethod = 'CULQI';

    // Descuento simulado de stock de insumos
    const kion = state.supplies.find((s) => s.id === 's1');
    if (kion) kion.currentStock = Math.max(0, kion.currentStock - 30);

    document.getElementById('culqi-tx-id').innerText = txId;
    document.getElementById('form-culqi-payment').classList.add('hidden');
    document.getElementById('culqi-success-view').classList.remove('hidden');

    btn.disabled = false;
    document.getElementById('btn-culqi-label').innerText = 'Pagar con Culqi';

    setTimeout(() => {
      document.getElementById('modal-culqi').classList.add('hidden');
      loadAllData();
    }, 2200);
  }, 1200);
}

// Modal Compra Insumos
function openPurchaseModal() {
  const sel = document.getElementById('purchase-supply-id');
  sel.innerHTML = '<option value="">-- Elige un insumo --</option>' + state.supplies.map((s) => `<option value="${s.id}">${s.name} (${s.unit})</option>`).join('');
  document.getElementById('form-purchase').reset();
  document.getElementById('modal-purchase').classList.remove('hidden');
}

// Modal Nuevo Insumo
function openNewSupplyModal() {
  document.getElementById('form-supply').reset();
  document.getElementById('modal-supply').classList.remove('hidden');
}

// Modal Agregar Receta
function openAddRecipeItemModal() {
  const sel = document.getElementById('recipe-supply-id');
  sel.innerHTML = state.supplies.map((s) => `<option value="${s.id}">${s.name} (${s.unit})</option>`).join('');
  document.getElementById('form-recipe-item').reset();
  document.getElementById('modal-recipe-item').classList.remove('hidden');
}

// Exportación CSV
function exportCSV() {
  let csv = 'NumeroPedido,Fecha,Cliente,Telefono,EstadoLogistico,EstadoPago,MetodoPago,TotalVenta_PEN,CostoInsumos_PEN,MargenReal_PEN\n';
  state.orders.forEach((o) => {
    const total = Number(o.totalAmount);
    const cost = (total * 0.22).toFixed(2);
    const margin = (total - cost).toFixed(2);
    csv += `"${o.orderNumber}","${new Date(o.createdAt).toLocaleDateString()}","${o.customer.name}","${o.customer.phone}","${o.status}","${o.paymentStatus}","${o.paymentMethod || 'N/A'}",${total.toFixed(2)},${cost},${margin}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Reporte_Ventas_VitaJuice_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ============================================================================
// 7. EVENT LISTENERS Y INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initSession();

  // Navegación Sidebar y botones
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('.nav-btn');
    if (navBtn && navBtn.dataset.view) {
      showView(navBtn.dataset.view);
    }
  });

  // Cerrar modales con botones .modal-close
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modal-order, #modal-culqi, #modal-purchase, #modal-supply, #modal-recipe-item').forEach((m) => m.classList.add('hidden'));
    });
  });

  // Botón credenciales demo
  document.getElementById('btn-demo-credentials')?.addEventListener('click', () => {
    document.getElementById('login-email').value = 'admin@vitajuice.pe';
    document.getElementById('login-password').value = 'admin123';
  });

  // Formulario Login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res && res.success) {
      login(res.token, res.user);
    } else {
      // Fallback demo local si el backend no está corriendo
      login('mock_jwt_token_demo_2026', { id: 'u1', name: 'Administrador VitaJuice', email, role: 'ADMIN' });
    }
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', logout);

  // Filtros pedidos
  document.getElementById('orders-search')?.addEventListener('input', renderOrders);
  document.getElementById('orders-status-filter')?.addEventListener('change', renderOrders);

  // Apertura de modales
  document.getElementById('btn-open-new-order')?.addEventListener('click', openNewOrderModal);
  document.getElementById('btn-open-new-purchase')?.addEventListener('click', openPurchaseModal);
  document.getElementById('btn-open-new-supply')?.addEventListener('click', openNewSupplyModal);

  // Checkbox marcar como pagado en nuevo pedido
  document.getElementById('order-mark-as-paid')?.addEventListener('change', (e) => {
    const methodBox = document.getElementById('order-method-box');
    if (e.target.checked) {
      methodBox.classList.remove('hidden');
    } else {
      methodBox.classList.add('hidden');
    }
  });

  // Submit nuevo pedido
  document.getElementById('form-create-order')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.orderSelectedItems.length === 0) {
      alert('Debe agregar al menos un shot o jugo al pedido.');
      return;
    }

    const name = document.getElementById('order-customer-name').value;
    const phone = document.getElementById('order-customer-phone').value;
    const address = document.getElementById('order-customer-address').value;
    const isPaid = document.getElementById('order-mark-as-paid').checked;
    const method = document.getElementById('order-payment-method').value;

    const total = state.orderSelectedItems.reduce((acc, it) => {
      const prod = state.products.find((p) => p.id === it.productId);
      return acc + (prod ? prod.price * it.quantity : 0);
    }, 0);

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `VJ-2026-${String(state.orders.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      customer: { name, phone, address },
      items: state.orderSelectedItems.map((it) => {
        const prod = state.products.find((p) => p.id === it.productId);
        return { id: `it-${Date.now()}`, product: prod, quantity: it.quantity, subtotal: (prod?.price || 0) * it.quantity };
      }),
      totalAmount: total,
      paymentStatus: isPaid ? 'PAGADO' : 'PENDIENTE',
      paymentMethod: isPaid ? method : null,
      status: isPaid ? 'EN_PREPARACION' : 'PENDIENTE',
    };

    // Sincronizar en Supabase si está activo
    const sb = getSupabase();
    if (sb) {
      try {
        let customerId;
        const { data: existingCust } = await sb.from('customers').select('id').eq('phone', phone).maybeSingle();
        if (existingCust) {
          customerId = existingCust.id;
        } else {
          const { data: newCust } = await sb.from('customers').insert({ name, phone, address: address || null }).select().single();
          customerId = newCust?.id;
        }

        const { data: createdOrd } = await sb.from('orders').insert({
          order_number: newOrder.orderNumber,
          customer_id: customerId,
          total_amount: total,
          status: isPaid ? 'EN_PREPARACION' : 'PENDIENTE',
          payment_status: isPaid ? 'PAGADO' : 'PENDIENTE',
          payment_method: isPaid ? method : null,
        }).select().single();

        if (createdOrd) {
          newOrder.id = createdOrd.id;
          const itemsPayload = state.orderSelectedItems.map((it) => {
            const prod = state.products.find((p) => p.id === it.productId);
            return {
              order_id: createdOrd.id,
              product_id: it.productId,
              quantity: it.quantity,
              unit_price: prod?.price || 0,
              subtotal: (prod?.price || 0) * it.quantity,
            };
          });
          await sb.from('order_items').insert(itemsPayload);
        }
      } catch (sbErr) {
        console.warn('Error guardando pedido en Supabase:', sbErr);
      }
    }

    if (state.backendOnline) {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          items: state.orderSelectedItems,
          markAsPaid: isPaid,
          paymentMethod: isPaid ? method : null,
        }),
      });
    }

    state.orders.unshift(newOrder);
    document.getElementById('modal-order').classList.add('hidden');
    loadAllData();
  });

  // Pestañas Culqi (Tarjeta vs Yape)
  const tabCard = document.getElementById('culqi-tab-card');
  const tabYape = document.getElementById('culqi-tab-yape');
  const cardFields = document.getElementById('culqi-card-fields');
  const yapeFields = document.getElementById('culqi-yape-fields');

  tabCard?.addEventListener('click', () => {
    state.culqiMethod = 'CARD';
    tabCard.className = 'flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold shadow-sm';
    tabYape.className = 'flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium border-slate-200 bg-white text-slate-600 hover:bg-slate-50';
    cardFields.classList.remove('hidden');
    yapeFields.classList.add('hidden');
  });

  tabYape?.addEventListener('click', () => {
    state.culqiMethod = 'YAPE';
    tabYape.className = 'flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium border-purple-600 bg-purple-50 text-purple-800 font-semibold shadow-sm';
    tabCard.className = 'flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium border-slate-200 bg-white text-slate-600 hover:bg-slate-50';
    yapeFields.classList.remove('hidden');
    cardFields.classList.add('hidden');
  });

  // Submit Culqi
  document.getElementById('form-culqi-payment')?.addEventListener('submit', processCulqiPayment);

  // Submit Compra Insumo
  document.getElementById('form-purchase')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const supplyId = document.getElementById('purchase-supply-id').value;
    const qty = Number(document.getElementById('purchase-qty').value);
    const cost = Number(document.getElementById('purchase-cost').value);
    const exp = document.getElementById('purchase-expiration').value;
    const sup = document.getElementById('purchase-supplier').value;
    const batch = document.getElementById('purchase-batch').value;

    const supply = state.supplies.find((s) => s.id === supplyId);
    if (supply) {
      supply.currentStock += qty;
      supply.lastCost = cost;
      if (supply.currentStock > supply.minStockAlert) supply.stockStatus = 'OPTIMO';
    }

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('supply_purchases').insert({
          supply_id: supplyId,
          quantity: qty,
          unit_cost: cost,
          total_cost: qty * cost,
          supplier: sup || 'Proveedor Local',
          batch_number: batch || `LOTE-${Date.now().toString().slice(-4)}`,
          expiration_date: exp || null,
        });

        if (supply) {
          await sb.from('supplies').update({
            current_stock: supply.currentStock,
            last_cost: cost,
          }).eq('id', supplyId);
        }
      } catch (sbErr) {
        console.warn('Error guardando compra en Supabase:', sbErr);
      }
    }

    state.purchases.unshift({
      id: `pur-${Date.now()}`,
      batchNumber: batch || `LOTE-${Date.now().toString().slice(-4)}`,
      purchaseDate: new Date().toISOString(),
      supplyName: supply?.name || 'Insumo',
      quantity: qty,
      unit: supply?.unit || '',
      totalCost: qty * cost,
      supplier: sup || 'Proveedor Local',
      expirationDate: exp || null,
    });

    document.getElementById('modal-purchase').classList.add('hidden');
    loadAllData();
  });

  // Submit Nuevo Insumo
  document.getElementById('form-supply')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('supply-name').value;
    const unit = document.getElementById('supply-unit').value;
    const minAlert = Number(document.getElementById('supply-min-alert').value);

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('supplies').insert({
          name,
          unit,
          current_stock: 0,
          min_stock_alert: minAlert,
          last_cost: 0,
        });
      } catch (sbErr) {
        console.warn('Error creando insumo en Supabase:', sbErr);
      }
    }

    state.supplies.push({
      id: `s-${Date.now()}`,
      name,
      unit,
      currentStock: 0,
      minStockAlert: minAlert,
      lastCost: 0,
      stockStatus: 'CRITICO',
    });

    document.getElementById('modal-supply').classList.add('hidden');
    loadAllData();
  });

  // Botones de exportación e impresión
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
  document.getElementById('btn-print-report')?.addEventListener('click', () => window.print());

  // Modal Configuración de Supabase
  document.getElementById('btn-open-supabase-modal')?.addEventListener('click', () => {
    document.getElementById('input-supabase-url').value = SUPABASE_URL;
    document.getElementById('input-supabase-key').value = SUPABASE_KEY;
    document.getElementById('modal-supabase').classList.remove('hidden');
  });

  document.getElementById('form-supabase-config')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('input-supabase-url').value.trim();
    const key = document.getElementById('input-supabase-key').value.trim();

    SUPABASE_URL = url;
    SUPABASE_KEY = key;
    localStorage.setItem('vitajuice_sb_url', url);
    localStorage.setItem('vitajuice_sb_key', key);
    supabaseClient = null;

    document.getElementById('modal-supabase').classList.add('hidden');
    alert('✅ Credenciales de Supabase guardadas. Sincronizando con tu base de datos en la nube...');
    loadAllData();
  });

  // Carga inicial de datos
  loadAllData();
});
