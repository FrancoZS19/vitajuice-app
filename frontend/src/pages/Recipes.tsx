import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Percent,
  Layers,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const Recipes: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [supplies, setSupplies] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [recipeData, setRecipeData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario agregar insumo a receta
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplyId, setNewSupplyId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const fetchProductsAndSupplies = async () => {
    try {
      setLoading(true);
      const [prodRes, suppRes] = await Promise.all([
        api.get('/products'),
        api.get('/supplies'),
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0 && !selectedProduct) {
          selectProduct(prodRes.data.data[0]);
        }
      }
      if (suppRes.data.success) setSupplies(suppRes.data.data);
    } catch (err) {
      console.error('Error al cargar recetas:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = async (product: any) => {
    setSelectedProduct(product);
    try {
      const res = await api.get(`/recipes/product/${product.id}`);
      if (res.data.success) {
        setRecipeData(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar detalle de receta:', err);
    }
  };

  useEffect(() => {
    fetchProductsAndSupplies();
  }, []);

  const handleAddSupplyToRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!selectedProduct) return;

    try {
      const res = await api.post('/recipes', {
        productId: selectedProduct.id,
        supplyId: newSupplyId,
        quantityNeeded: Number(newQuantity),
      });

      if (res.data.success) {
        setShowAddModal(false);
        setNewSupplyId('');
        setNewQuantity('');
        selectProduct(selectedProduct);
        // refrescar productos para actualizar costos
        const updatedProds = await api.get('/products');
        setProducts(updatedProds.data.data);
      }
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Error al agregar insumo.');
    }
  };

  const handleDeleteItem = async (recipeItemId: string) => {
    if (!window.confirm('¿Seguro que deseas retirar este insumo de la ficha técnica?')) return;
    try {
      await api.delete(`/recipes/${recipeItemId}`);
      selectProduct(selectedProduct);
      const updatedProds = await api.get('/products');
      setProducts(updatedProds.data.data);
    } catch (err) {
      alert('Error al eliminar insumo.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Fichas Técnicas y Recetas"
        subtitle="Estructura de consumo de insumos por cada shot de VitaJuice y costo de producción"
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Lista de Shots y Bebidas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Catálogo de Productos</h3>
              <span className="text-xs text-slate-400 font-mono">{products.length} productos</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {products.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                        {p.category}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">P. Venta: <strong className="text-slate-800">S/. {Number(p.price).toFixed(2)}</strong></span>
                      <span className="text-emerald-700 font-semibold">
                        Margen: {p.marginPercentage}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Ficha Técnica Detallada del Shot Seleccionado */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {selectedProduct ? (
              <>
                {/* Cabecera del Producto */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{selectedProduct.name}</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                        {selectedProduct.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">{selectedProduct.description}</p>
                  </div>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Insumo
                  </button>
                </div>

                {/* Métricas Financieras de la Ficha Técnica */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Precio de Venta</span>
                    <p className="text-xl font-black text-slate-900 mt-1">S/. {Number(selectedProduct.price).toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Costo Insumos (Receta)</span>
                    <p className="text-xl font-black text-amber-900 mt-1">
                      S/. {recipeData?.productionCost ? Number(recipeData.productionCost).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Margen Bruto Unitario</span>
                    <p className="text-xl font-black text-emerald-900 mt-1">
                      S/. {(Number(selectedProduct.price) - (recipeData?.productionCost || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Lista de Insumos de la Receta */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">
                    Ingredientes y Envases Requeridos por Unidad (60ml)
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase">
                        <tr>
                          <th className="p-3">Insumo Requerido</th>
                          <th className="p-3">Dosis por Unidad</th>
                          <th className="p-3">Costo Unitario Insumo</th>
                          <th className="p-3">Costo en la Receta</th>
                          <th className="p-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recipeData?.items && recipeData.items.length > 0 ? (
                          recipeData.items.map((it: any) => {
                            const cost = Number(it.quantityNeeded) * Number(it.supply.lastCost);
                            return (
                              <tr key={it.id} className="hover:bg-slate-50/60">
                                <td className="p-3 font-semibold text-slate-800">{it.supply.name}</td>
                                <td className="p-3 font-mono font-bold text-slate-900">
                                  {Number(it.quantityNeeded)} {it.supply.unit}
                                </td>
                                <td className="p-3 font-mono text-slate-600">
                                  S/. {Number(it.supply.lastCost).toFixed(3)} / {it.supply.unit}
                                </td>
                                <td className="p-3 font-mono font-bold text-emerald-700">
                                  S/. {cost.toFixed(3)}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeleteItem(it.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                    title="Eliminar de la receta"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                              Este producto no tiene insumos configurados aún en su ficha técnica.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-slate-400 py-16">Selecciona un producto para ver su ficha técnica.</p>
            )}
          </div>
        </div>

        {/* Modal Agregar Insumo */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
              <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                <h3 className="text-base font-bold">Agregar Ingrediente a la Receta</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSupplyToRecipe} className="p-6 space-y-4">
                {addError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{addError}</div>}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Materia Prima / Insumo *</label>
                  <select
                    required
                    value={newSupplyId}
                    onChange={(e) => setNewSupplyId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {supplies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cantidad consumida por cada 1 unidad de shot *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    placeholder="Ej. 15 (para 15g o 15ml)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Guardar en Ficha
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
