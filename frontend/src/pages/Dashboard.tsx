import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Package,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [alertsSummary, setAlertsSummary] = useState<any | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [metricsRes, alertsRes, ordersRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/alerts'),
          api.get('/orders?take=5'),
        ]);

        if (metricsRes.data.success) setMetrics(metricsRes.data.data);
        if (alertsRes.data.success) setAlertsSummary(alertsRes.data);
        if (ordersRes.data.success) setRecentOrders(ordersRes.data.data.slice(0, 5));
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Panel General de Control"
        subtitle="Métricas en tiempo real para VitaJuice by Rena"
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Banner de Alertas Preventivas si existen */}
        {alertsSummary?.summary?.total > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Atención Operativa: Hay {alertsSummary.summary.total} alerta(s) activas en el sistema
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  {alertsSummary.summary.lowStockCount} insumo(s) con stock bajo •{' '}
                  {alertsSummary.summary.expiringCount} lote(s) próximo(s) a vencer •{' '}
                  {alertsSummary.summary.staleOrdersCount} pedido(s) antiguo(s) por cobrar.
                </p>
              </div>
            </div>
            <Link
              to="/alerts"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1 shrink-0"
            >
              Resolver Alertas
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Tarjetas de Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Ventas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas Cobradas</span>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">
                S/. {metrics?.financials?.totalRevenue ? Number(metrics.financials.totalRevenue).toFixed(2) : '0.00'}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {metrics?.financials?.paidOrdersCount || 0} pedidos confirmados
              </p>
            </div>
          </div>

          {/* Margen Real */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Margen de Ganancia Real</span>
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">
                S/. {metrics?.financials?.realGrossMargin ? Number(metrics.financials.realGrossMargin).toFixed(2) : '0.00'}
              </h3>
              <p className="text-xs text-blue-600 font-semibold mt-1">
                {metrics?.financials?.marginPercentage ? `${metrics.financials.marginPercentage}% de rentabilidad bruta` : '0%'}
              </p>
            </div>
          </div>

          {/* Pedidos Totales / Pendientes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pedidos Activos</span>
              <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics?.kpis?.totalOrdersCount || 0}
              </h3>
              <p className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {metrics?.kpis?.pendingOrdersCount || 0} pendientes de pago
              </p>
            </div>
          </div>

          {/* Shots y Jugos Vendidos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unidades Vendidas</span>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">
                {metrics?.financials?.totalItemsSold || 0}
              </h3>
              <p className="text-xs text-amber-700 font-medium mt-1">
                En lotes de producción comercial
              </p>
            </div>
          </div>
        </div>

        {/* Sección Central: Ranking de Shots y Pedidos Recientes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Shots más vendidos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-sm">Shots Más Vendidos</h4>
              <Link to="/reports" className="text-xs text-emerald-600 hover:underline font-semibold">
                Ver detalle
              </Link>
            </div>

            <div className="space-y-4">
              {metrics?.topProducts && metrics.topProducts.length > 0 ? (
                metrics.topProducts.slice(0, 4).map((p: any, idx: number) => (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {p.name}
                      </span>
                      <span className="text-slate-500 font-mono">{p.quantity} und • S/. {p.revenue}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (p.quantity / (metrics.topProducts[0]?.quantity || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No hay datos de ventas aún.</p>
              )}
            </div>
          </div>

          {/* Últimos Pedidos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 text-sm">Últimos Pedidos Registrados</h4>
                <Link
                  to="/orders"
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Ir a Pedidos
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                      <th className="pb-2">N° Pedido</th>
                      <th className="pb-2">Cliente (WhatsApp)</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2">Estado Pago</th>
                      <th className="pb-2">Logística</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-800">{ord.orderNumber}</td>
                        <td className="py-3">
                          <p className="font-semibold text-slate-800">{ord.customer.name}</p>
                          <p className="text-[11px] text-slate-400">{ord.customer.phone}</p>
                        </td>
                        <td className="py-3 font-bold text-slate-900">S/. {Number(ord.totalAmount).toFixed(2)}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              ord.paymentStatus === 'PAGADO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-700">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>Gestión centralizada de pedidos para VitaJuice</span>
              <Link to="/orders" className="text-emerald-600 font-semibold hover:underline flex items-center gap-1">
                Ver todos los pedidos <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
