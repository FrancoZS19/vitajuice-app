import React, { useEffect, useState } from 'react';
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  Calendar,
  Truck,
  CheckCircle2,
  X,
  History,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const Inventory: React.FC = () => {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showCreateSupplyModal, setShowCreateSupplyModal] = useState(false);

  // Formulario Compra
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Formulario Nuevo Insumo
  const [newSupplyName, setNewSupplyName] = useState('');
  const [newSupplyUnit, setNewSupplyUnit] = useState('g');
  const [newSupplyMinAlert, setNewSupplyMinAlert] = useState('1000');
  const [newSupplyInitialStock, setNewSupplyInitialStock] = useState('0');
  const [newSupplyCost, setNewSupplyCost] = useState('0');
  const [supplyError, setSupplyError] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [suppliesRes, purchasesRes] = await Promise.all([
        api.get('/supplies'),
        api.get('/supplies/purchases'),
      ]);

      if (suppliesRes.data.success) setSupplies(suppliesRes.data.data);
      if (purchasesRes.data.success) setPurchases(purchasesRes.data.data);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRegisterPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);

    try {
      const res = await api.post('/supplies/purchases', {
        supplyId: selectedSupplyId,
        quantity: Number(purchaseQty),
        unitCost: Number(purchaseCost),
        expirationDate: expirationDate || null,
        supplier: supplier || null,
        batchNumber: batchNumber || null,
      });

      if (res.data.success) {
        setShowPurchaseModal(false);
        setSelectedSupplyId('');
        setPurchaseQty('');
        setPurchaseCost('');
        setExpirationDate('');
        setSupplier('');
        setBatchNumber('');
        fetchInventory();
      }
    } catch (err: any) {
      setPurchaseError(err.response?.data?.message || 'Error al registrar la compra.');
    }
  };

  const handleCreateSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplyError(null);

    try {
      const res = await api.post('/supplies', {
        name: newSupplyName,
        unit: newSupplyUnit,
        minStockAlert: Number(newSupplyMinAlert),
        currentStock: Number(newSupplyInitialStock),
        lastCost: Number(newSupplyCost),
      });

      if (res.data.success) {
        setShowCreateSupplyModal(false);
        setNewSupplyName('');
        fetchInventory();
      }
    } catch (err: any) {
      setSupplyError(err.response?.data?.message || 'Error al crear el insumo.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Inventario y Compras"
        subtitle="Control de materias primas, umbrales de alerta y trazabilidad de lotes perecederos"
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Acciones principales */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Materias Primas & Envases</h3>
            <p className="text-xs text-slate-500">
              Descuento automático por cada shot de VitaJuice vendido en el sistema
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateSupplyModal(true)}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
            >
              + Nuevo Insumo
            </button>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Compra / Entrada de Stock
            </button>
          </div>
        </div>

        {/* Tabla de Insumos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-4">Insumo / Materia Prima</th>
                  <th className="p-4">Stock Actual</th>
                  <th className="p-4">Umbral Mínimo (Alerta)</th>
                  <th className="p-4">Estado del Stock</th>
                  <th className="p-4">Costo Ref. Unitario</th>
                  <th className="p-4">Última Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplies.map((s) => {
                  const isLow = s.stockStatus === 'BAJO' || s.stockStatus === 'CRITICO';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                        {s.name}
                        {isLow && (
                          <span title="Stock por debajo del umbral" className="text-amber-500">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-900 text-sm">
                        {Number(s.currentStock).toLocaleString()} <span className="text-xs text-slate-500 font-sans">{s.unit}</span>
                      </td>

                      <td className="p-4 text-slate-500 font-mono">
                        {Number(s.minStockAlert).toLocaleString()} {s.unit}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                            s.stockStatus === 'OPTIMO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.stockStatus === 'BAJO'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-red-100 text-red-800 font-black'
                          }`}
                        >
                          {s.stockStatus}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-700">
                        S/. {Number(s.lastCost).toFixed(3)} / {s.unit}
                      </td>

                      <td className="p-4 text-slate-400 text-[11px]">
                        {s.purchases && s.purchases[0] ? (
                          <span>
                            {new Date(s.purchases[0].purchaseDate).toLocaleDateString()} (
                            {Number(s.purchases[0].quantity)} {s.unit})
                          </span>
                        ) : (
                          'Sin compras registradas'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de Compras y Trazabilidad de Vencimientos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-800">
              Historial de Lotes Comprados y Vencimientos de Insumos Perecederos
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Lote</th>
                  <th className="p-3">Fecha Compra</th>
                  <th className="p-3">Insumo</th>
                  <th className="p-3">Cantidad Comprada</th>
                  <th className="p-3">Costo Total</th>
                  <th className="p-3">Proveedor</th>
                  <th className="p-3">Fecha Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {purchases.slice(0, 8).map((p) => {
                  const hasExp = !!p.expirationDate;
                  const expDate = hasExp ? new Date(p.expirationDate) : null;
                  const isNear = expDate && expDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-700">{p.batchNumber || 'N/A'}</td>
                      <td className="p-3 text-slate-500">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-slate-800">{p.supply.name}</td>
                      <td className="p-3 font-mono">
                        {Number(p.quantity)} {p.supply.unit}
                      </td>
                      <td className="p-3 font-bold text-slate-900">S/. {Number(p.totalCost).toFixed(2)}</td>
                      <td className="p-3 text-slate-600">{p.supplier || 'Local'}</td>
                      <td className="p-3">
                        {hasExp ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isNear ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            📅 {expDate?.toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">No perecible</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Registrar Compra */}
        {showPurchaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="bg-emerald-700 p-5 text-white flex justify-between items-center">
                <h3 className="text-base font-bold">Registrar Entrada de Insumos</h3>
                <button onClick={() => setShowPurchaseModal(false)} className="text-emerald-200 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterPurchase} className="p-6 space-y-4">
                {purchaseError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{purchaseError}</div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seleccionar Insumo *</label>
                  <select
                    required
                    value={selectedSupplyId}
                    onChange={(e) => setSelectedSupplyId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="">-- Elige un insumo --</option>
                    {supplies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad Comprada *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={purchaseQty}
                      onChange={(e) => setPurchaseQty(e.target.value)}
                      placeholder="Ej. 5000"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Costo Unitario (S/.) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={purchaseCost}
                      onChange={(e) => setPurchaseCost(e.target.value)}
                      placeholder="Ej. 0.015"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Vencimiento (Obligatorio para frutas/raíces)
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Proveedor</label>
                    <input
                      type="text"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="Ej. Mercado Mayorista"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">N° de Lote</label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="Ej. LOTE-JEN-2026"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPurchaseModal(false)}
                    className="px-4 py-2 border text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Guardar e Incrementar Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Crear Insumo */}
        {showCreateSupplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                <h3 className="text-base font-bold">Nuevo Insumo o Envase</h3>
                <button onClick={() => setShowCreateSupplyModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSupply} className="p-6 space-y-4">
                {supplyError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{supplyError}</div>}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Insumo *</label>
                  <input
                    type="text"
                    required
                    value={newSupplyName}
                    onChange={(e) => setNewSupplyName(e.target.value)}
                    placeholder="Ej. Menta fresca"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unidad de Medida *</label>
                    <select
                      value={newSupplyUnit}
                      onChange={(e) => setNewSupplyUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none"
                    >
                      <option value="g">Gramos (g)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="unidad">Unidad (botellas/tapas)</option>
                      <option value="kg">Kilos (kg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Umbral Alerta Mínima *</label>
                    <input
                      type="number"
                      required
                      value={newSupplyMinAlert}
                      onChange={(e) => setNewSupplyMinAlert(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateSupplyModal(false)}
                    className="px-4 py-2 border text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Crear Insumo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
