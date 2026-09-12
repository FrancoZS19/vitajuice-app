import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ScrollText,
  AlertTriangle,
  BarChart3,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const [alertCount, setAlertCount] = useState<number>(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await api.get('/alerts');
        if (res.data?.summary?.total) {
          setAlertCount(res.data.summary.total);
        }
      } catch (err) {
        // Silencioso en caso de inicialización
      }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 20000); // Polling suave cada 20s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Ventas & Pedidos', icon: ShoppingCart },
    { to: '/inventory', label: 'Inventario & Compras', icon: Boxes },
    { to: '/recipes', label: 'Fichas Técnicas (Recetas)', icon: ScrollText },
    {
      to: '/alerts',
      label: 'Bandeja de Alertas',
      icon: AlertTriangle,
      badge: alertCount > 0 ? alertCount : null,
    },
    { to: '/reports', label: 'Reportes & Margen', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-900/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">VitaJuice</h1>
          <p className="text-xs text-emerald-400 font-medium tracking-wide uppercase">by Rena • Gestión</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Administrador'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@vitajuice.pe'}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
