import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCSV = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    window.open(`${apiBase}/reports/export-csv`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Panel de Reportes y Rentabilidad Real"
        subtitle="Métricas financieras, análisis de costo de recetas y exportación para Sprint Reviews"
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Acciones de Exportación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Reporte Consolidado del Sprint
            </h3>
            <p className="text-xs text-slate-500">
              Información auditada de ventas cobradas vs insumos consumidos en producción
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar en PDF
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Datos (CSV)
            </button>
          </div>
        </div>

        {/* Resumen Financiero Ejecutivo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Total Ventas Cobradas</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              S/. {data?.financials?.totalRevenue ? Number(data.financials.totalRevenue).toFixed(2) : '0.00'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sobre {data?.financials?.paidOrdersCount || 0} pedidos confirmados
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-amber-700 text-xs font-bold uppercase tracking-wider">
              <span>Costo Total Insumos Usados</span>
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-3xl font-black text-amber-900 mt-2">
              S/. {data?.financials?.totalSupplyCost ? Number(data.financials.totalSupplyCost).toFixed(2) : '0.00'}
            </h3>
            <p className="text-xs text-amber-700 mt-1">
              Descontado según receta de los {data?.financials?.totalItemsSold || 0} shots vendidos
            </p>
          </div>

          <div className="bg-gradient-to-tr from-emerald-700 to-teal-800 text-white p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center text-emerald-100 text-xs font-bold uppercase tracking-wider">
              <span>Margen de Ganancia Real</span>
              <TrendingUp className="w-4 h-4 text-emerald-200" />
            </div>
            <h3 className="text-3xl font-black text-white mt-2">
              S/. {data?.financials?.realGrossMargin ? Number(data.financials.realGrossMargin).toFixed(2) : '0.00'}
            </h3>
            <p className="text-xs text-emerald-200 font-semibold mt-1">
              Rentabilidad bruta real: {data?.financials?.marginPercentage}%
            </p>
          </div>
        </div>

        {/* Tabla de Rendimiento y Margen por Producto */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Desglose de Rentabilidad por Producto (Shots de VitaJuice)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Fórmula aplicada: Margen (S/.) = Total Facturado - (Insumos consumidos x Costo de compra)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-3">Ranking / Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Unidades Vendidas</th>
                  <th className="p-3">Venta Total (S/.)</th>
                  <th className="p-3">Costo Insumos (S/.)</th>
                  <th className="p-3">Margen Real (S/.)</th>
                  <th className="p-3">Rentabilidad (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.topProducts && data.topProducts.length > 0 ? (
                  data.topProducts.map((p: any, idx: number) => (
                    <tr key={p.name} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-800">
                        <span className="font-mono text-slate-400 mr-2">#{idx + 1}</span>
                        {p.name}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">{p.quantity} und</td>
                      <td className="p-3 font-mono font-semibold text-slate-800">S/. {p.revenue.toFixed(2)}</td>
                      <td className="p-3 font-mono text-amber-700">S/. {p.cost.toFixed(2)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">S/. {p.margin.toFixed(2)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          {p.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No hay datos de ventas pagadas registradas en el período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Justificación Metodológica para el Profesor / Sprint Review */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
            Sustentación Técnica para Sprint Review (ISIL - Scrum)
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Problema resuelto:</strong> Antes de esta solución, VitaJuice gestionaba ventas por WhatsApp sin
            saber su rentabilidad real por lote de producción. Al integrar la <strong>Ficha Técnica (Receta)</strong> con el{' '}
            <strong>Inventario de Insumos</strong> y la <strong>Pasarela Culqi</strong>, cada venta confirmada deduce en tiempo real
            los gramos y mililitros exactos de materia prima, arrojando el margen neto real sin estimaciones manuales.
          </p>
        </div>
      </main>
    </div>
  );
};
