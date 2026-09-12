import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  CreditCard,
  CheckCircle,
  Clock,
  Truck,
  Phone,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CulqiModal } from '../components/CulqiModal';
import { api } from '../services/api';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrderForCulqi, setSelectedOrderForCulqi] = useState<any | null>(null);

  // Formulario nuevo pedido
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [markAsPaidNow, setMarkAsPaidNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter || undefined,
        },
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar catálogo de productos:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleAddItem = (productId: string) => {
    const existing = selectedItems.find((i) => i.productId === productId);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { productId, quantity: 1 }]);
    }
  };

  const handleUpdateItemQty = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as { productId: string; quantity: number }[]
    );
  };

  const calculateTotal = () => {
    return selectedItems.reduce((acc, it) => {
      const prod = products.find((p) => p.id === it.productId);
      return acc + (prod ? Number(prod.price) * it.quantity : 0);
    }, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedItems.length === 0) {
      setFormError('Debe agregar al menos un shot o jugo al pedido.');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        customerName,
        customerPhone,
        customerAddress,
        notes: orderNotes,
        items: selectedItems,
        markAsPaid: markAsPaidNow,
        paymentMethod: markAsPaidNow ? paymentMethod : null,
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        setShowCreateModal(false);
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setOrderNotes('');
        setSelectedItems([]);
        setMarkAsPaidNow(false);
        fetchOrders();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al crear el pedido.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Ventas y Pedidos"
        subtitle="Registro de pedidos por WhatsApp, seguimiento logístico y cobros"
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Barra superior de acciones y filtros */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, teléfono o N°..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors"
            >
              Buscar
            </button>
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none"
            >
              <option value="">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="EN_PREPARACION">En Preparación</option>
              <option value="EN_CAMINO">En Camino</option>
              <option value="ENTREGADO">Entregados</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo Pedido (WhatsApp)
            </button>
          </div>
        </div>

        {/* Tabla de Pedidos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-4">Pedido / Fecha</th>
                  <th className="p-4">Cliente (WhatsApp)</th>
                  <th className="p-4">Detalle de Shots</th>
                  <th className="p-4">Importe Total</th>
                  <th className="p-4">Estado de Pago</th>
                  <th className="p-4">Estado Logístico</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No se encontraron pedidos registrados.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-slate-900 block">{ord.orderNumber}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-800">{ord.customer.name}</p>
                        <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {ord.customer.phone}
                        </p>
                        {ord.customer.address && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            📍 {ord.customer.address}
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1 max-w-xs">
                          {ord.items.map((it: any) => (
                            <span
                              key={it.id}
                              className="inline-block bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded mr-1 font-medium"
                            >
                              {it.quantity}x {it.product.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 font-black text-slate-900 text-sm">
                        S/. {Number(ord.totalAmount).toFixed(2)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            ord.paymentStatus === 'PAGADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.paymentStatus === 'PAGADO' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          {ord.paymentStatus}
                        </span>
                        {ord.paymentMethod && (
                          <span className="block text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                            Vía {ord.paymentMethod}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white focus:outline-none"
                        >
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="EN_PREPARACION">En Preparación</option>
                          <option value="EN_CAMINO">En Camino</option>
                          <option value="ENTREGADO">Entregado</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        {ord.paymentStatus !== 'PAGADO' && (
                          <button
                            onClick={() => setSelectedOrderForCulqi(ord)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 ml-auto transition-all"
                            title="Cobrar mediante pasarela Culqi"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Cobrar Culqi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Culqi Pasarela */}
        {selectedOrderForCulqi && (
          <CulqiModal
            order={selectedOrderForCulqi}
            onClose={() => setSelectedOrderForCulqi(null)}
            onPaymentSuccess={() => {
              setSelectedOrderForCulqi(null);
              fetchOrders();
            }}
          />
        )}

        {/* Modal Crear Nuevo Pedido */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Registrar Nuevo Pedido</h3>
                  <p className="text-xs text-slate-400">Canal WhatsApp / Redes Sociales</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Datos del Cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Cliente *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej. Valeria Thorne"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Teléfono *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej. 987654321"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección de Entrega</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Ej. Av. Larco 743, Dpto 501, Miraflores"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Selector de Catálogo de Shots */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Seleccionar Shots y Bebidas de VitaJuice
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddItem(p.id)}
                        className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group"
                      >
                        <p className="font-bold text-xs text-slate-800 group-hover:text-emerald-800 line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          S/. {Number(p.price).toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Seleccionados */}
                {selectedItems.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Shots agregados al pedido:</span>
                    {selectedItems.map((it) => {
                      const prod = products.find((p) => p.id === it.productId);
                      return (
                        <div key={it.productId} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-800">{prod?.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(it.productId, -1)}
                              className="w-6 h-6 rounded bg-white border border-slate-300 font-bold hover:bg-slate-100"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold w-4 text-center">{it.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(it.productId, 1)}
                              className="w-6 h-6 rounded bg-white border border-slate-300 font-bold hover:bg-slate-100"
                            >
                              +
                            </button>
                            <span className="font-bold text-slate-900 w-16 text-right">
                              S/. {((prod?.price || 0) * it.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                      <span>Total:</span>
                      <span>S/. {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Marcar como pagado */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markAsPaidNow}
                      onChange={(e) => setMarkAsPaidNow(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-emerald-900">
                      Confirmar pago de inmediato (Descuenta stock de insumos automáticamente)
                    </span>
                  </label>

                  {markAsPaidNow && (
                    <div className="pl-6">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none"
                      >
                        <option value="EFECTIVO">Efectivo contra entrega</option>
                        <option value="YAPE">Yape / Plin</option>
                        <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                        <option value="CULQI">Culqi Link de Pago</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {formSubmitting ? 'Guardando...' : 'Crear Pedido'}
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
