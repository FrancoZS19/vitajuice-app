import React, { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle2, AlertCircle, X, Shield, Lock } from 'lucide-react';
import { api } from '../services/api';

interface CulqiModalProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
  };
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const CulqiModal: React.FC<CulqiModalProps> = ({ order, onClose, onPaymentSuccess }) => {
  const [method, setMethod] = useState<'CARD' | 'YAPE'>('CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Campos simulados de tarjeta (Valores predefinidos de prueba de Culqi)
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [email, setEmail] = useState(order.customer.email || 'cliente@gmail.com');
  const [yapeOtp, setYapeOtp] = useState('123456');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generamos un token de test compatible con Culqi
      const testToken = `tkn_test_${method.toLowerCase()}_${Date.now()}`;

      const res = await api.post('/payments/culqi-charge', {
        orderId: order.id,
        token: testToken,
        email: email,
      });

      if (res.data.success) {
        setSuccessData(res.data);
        setTimeout(() => {
          onPaymentSuccess();
        }, 2200);
      } else {
        setError(res.data.message || 'Error al procesar pago.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con la pasarela Culqi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Cabecera Culqi Sandbox */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">
                Culqi Sandbox Perú
              </span>
              <span className="text-xs text-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Seguro 256-bit
              </span>
            </div>
            <h3 className="text-xl font-bold">Pasarela de Pagos</h3>
            <p className="text-xs text-emerald-100">Pedido {order.orderNumber} • {order.customer.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del cobro */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">Total a pagar:</span>
          <span className="text-2xl font-black text-slate-900">S/. {Number(order.totalAmount).toFixed(2)}</span>
        </div>

        {/* Éxito */}
        {successData ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">¡Pago Confirmado por Culqi!</h4>
            <p className="text-xs text-slate-500">
              ID de Transacción: <span className="font-mono text-emerald-700 font-semibold">{successData.data?.payment?.transactionId}</span>
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-left">
              ✨ <strong>Acción del sistema:</strong> El pedido pasó a estado <strong>PAGADO</strong> y el stock de insumos de su receta fue descontado automáticamente de almacén.
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Selector de Método */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('CARD')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  method === 'CARD'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Tarjeta Débito/Crédito
              </button>
              <button
                type="button"
                onClick={() => setMethod('YAPE')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  method === 'YAPE'
                    ? 'border-purple-600 bg-purple-50 text-purple-800 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-purple-600" />
                Yape con Código
              </button>
            </div>

            {/* Formulario según método */}
            {method === 'CARD' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correo para comprobante</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Número de tarjeta (Test)</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiración</label>
                    <input
                      type="text"
                      required
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                  <p className="font-semibold">Paga con Yape (Pruebas Culqi):</p>
                  <p>Abre tu App Yape → Código de Aprobación → ingresa los 6 dígitos generados.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código de aprobación Yape (6 dígitos)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={yapeOtp}
                    onChange={(e) => setYapeOtp(e.target.value)}
                    className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              {loading ? 'Procesando con Culqi...' : `Pagar S/. ${Number(order.totalAmount).toFixed(2)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
