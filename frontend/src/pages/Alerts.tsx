import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Phone,
  ArrowRight,
  Boxes,
  ShieldAlert,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts');
      if (res.data.success) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Error al consultar alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Bandeja de Alertas Operativas"
        subtitle="Monitoreo preventivo de stock crítico, vencimiento de materias primas y pedidos rezagados"
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Resumen de Alertas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Insumos en Stock Bajo</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {alerts?.summary?.lowStockCount || 0}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Boxes className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Lotes Próximos a Vencer</span>
              <h3 className="text-2xl font-black text-red-600 mt-1">
                {alerts?.summary?.expiringCount || 0}
              </h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Pedidos Estancados (&gt;3 días)</span>
              <h3 className="text-2xl font-black text-blue-600 mt-1">
                {alerts?.summary?.staleOrdersCount || 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Sección 1: Alertas de Stock Bajo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="text-base font-bold text-slate-900">
                1. Alerta de Stock Bajo (Umbral de Seguridad)
              </h4>
            </div>
            <Link
              to="/inventory"
              className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
            >
              Comprar en Almacén <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {alerts?.data?.lowStock && alerts.data.lowStock.length > 0 ? (
            <div className="space-y-3">
              {alerts.data.lowStock.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                    <p className="text-xs text-amber-800 mt-0.5">{item.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-700 block">
                      Actual: {item.currentStock} {item.unit} / Mínimo: {item.minStockAlert} {item.unit}
                    </span>
                    <Link
                      to="/inventory"
                      className="mt-1 inline-block px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Reponer Stock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Todos los insumos se encuentran en niveles óptimos de seguridad.</span>
            </div>
          )}
        </div>

        {/* Sección 2: Alertas de Insumos Próximos a Vencer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-600" />
              <h4 className="text-base font-bold text-slate-900">
                2. Alerta de Vencimiento de Lotes Perecederos (Ventana de 7 Días)
              </h4>
            </div>
          </div>

          {alerts?.data?.expiringSupplies && alerts.data.expiringSupplies.length > 0 ? (
            <div className="space-y-3">
              {alerts.data.expiringSupplies.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-red-200 bg-red-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{item.supplyName}</span>
                    <p className="text-xs text-red-800 mt-0.5">{item.message}</p>
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                      Lote: {item.batchNumber} • Cantidad: {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-lg block">
                      Vence: {new Date(item.expirationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>No hay lotes con fecha de caducidad próxima en los próximos 7 días.</span>
            </div>
          )}
        </div>

        {/* Sección 3: Alertas de Pedidos Pendientes de Pago */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="text-base font-bold text-slate-900">
                3. Alerta de Pedidos sin Cobrar (&gt; 3 días de antigüedad)
              </h4>
            </div>
            <Link
              to="/orders"
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              Ver todos en Pedidos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {alerts?.data?.staleOrders && alerts.data.staleOrders.length > 0 ? (
            <div className="space-y-3">
              {alerts.data.staleOrders.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {item.orderNumber} • Cliente: {item.customerName}
                    </span>
                    <p className="text-xs text-blue-900 mt-0.5">{item.message}</p>
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                      Registrado el {new Date(item.createdAt).toLocaleDateString()} ({item.daysPending} días pendiente)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://wa.me/51${item.customerPhone}?text=Hola%20${encodeURIComponent(
                        item.customerName
                      )},%20te%20escribimos%20de%20VitaJuice%20by%20Rena%20respecto%20a%20tu%20pedido%20${
                        item.orderNumber
                      }.`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      WhatsApp
                    </a>
                    <Link
                      to="/orders"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Ver Pedido
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>No hay pedidos pendientes de cobro con más de 3 días de antigüedad.</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
