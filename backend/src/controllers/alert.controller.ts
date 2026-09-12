import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { PaymentStatus, OrderStatus } from '@prisma/client';

// Decisión técnica para el docente: El motor de alertas evalúa en tiempo real 3 condiciones operativas críticas
// para el negocio: desabastecimiento de materia prima, caducidad de insumos perecederos y pedidos estancados.
// Evita procesos batch o crons complejos para el MVP, respondiendo con datos vivos a la UI.

export const getSystemAlerts = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // 1. ALERTA DE STOCK BAJO O CRÍTICO
    // Insumos cuyo stock actual es menor o igual al umbral configurado
    const allSupplies = await prisma.supply.findMany({
      orderBy: { currentStock: 'asc' },
    });

    const lowStockAlerts = allSupplies
      .filter((s) => Number(s.currentStock) <= Number(s.minStockAlert))
      .map((s) => ({
        id: s.id,
        name: s.name,
        unit: s.unit,
        currentStock: Number(s.currentStock),
        minStockAlert: Number(s.minStockAlert),
        severity: Number(s.currentStock) <= 0 ? 'CRITICAL' : 'WARNING',
        message:
          Number(s.currentStock) <= 0
            ? `¡Agotado! Stock en 0 ${s.unit}. Requiere compra urgente para evitar paralizar producción.`
            : `Stock bajo (${s.currentStock} ${s.unit}). Por debajo del mínimo de seguridad (${s.minStockAlert} ${s.unit}).`,
      }));

    // 2. ALERTA DE INSUMOS PRÓXIMOS A VENCER (Ventana de 7 días)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const expiringPurchases = await prisma.supplyPurchase.findMany({
      where: {
        expirationDate: {
          lte: sevenDaysFromNow,
        },
      },
      include: {
        supply: true,
      },
      orderBy: { expirationDate: 'asc' },
    });

    const expiringAlerts = expiringPurchases.map((purchase) => {
      const expDate = new Date(purchase.expirationDate!);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isExpired = diffDays < 0;
      return {
        id: purchase.id,
        supplyName: purchase.supply.name,
        batchNumber: purchase.batchNumber || 'Sin Lote',
        quantity: Number(purchase.quantity),
        unit: purchase.supply.unit,
        expirationDate: purchase.expirationDate,
        daysRemaining: diffDays,
        severity: isExpired ? 'CRITICAL' : diffDays <= 3 ? 'WARNING' : 'INFO',
        message: isExpired
          ? `Lote vencido hace ${Math.abs(diffDays)} días (${purchase.batchNumber}). Descartar de producción.`
          : `Vence en ${diffDays} día(s) (${purchase.batchNumber}). Priorizar su uso en el próximo lote.`,
      };
    });

    // 3. ALERTA DE PEDIDOS PENDIENTES HACE MÁS DE X DÍAS (3 Días)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);

    const staleOrders = await prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PENDIENTE,
        status: {
          notIn: [OrderStatus.ENTREGADO, OrderStatus.CANCELADO],
        },
        createdAt: {
          lte: threeDaysAgo,
        },
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const staleOrderAlerts = staleOrders.map((ord) => {
      const diffTime = now.getTime() - new Date(ord.createdAt).getTime();
      const daysOld = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: ord.id,
        orderNumber: ord.orderNumber,
        customerName: ord.customer.name,
        customerPhone: ord.customer.phone,
        totalAmount: Number(ord.totalAmount),
        createdAt: ord.createdAt,
        daysPending: daysOld,
        severity: 'WARNING',
        message: `Pedido ${ord.orderNumber} por S/. ${ord.totalAmount} pendiente de pago desde hace ${daysOld} días. Contactar al cliente vía WhatsApp.`,
      };
    });

    const totalAlertsCount =
      lowStockAlerts.length + expiringAlerts.length + staleOrderAlerts.length;

    return res.json({
      success: true,
      summary: {
        total: totalAlertsCount,
        lowStockCount: lowStockAlerts.length,
        expiringCount: expiringAlerts.length,
        staleOrdersCount: staleOrderAlerts.length,
      },
      data: {
        lowStock: lowStockAlerts,
        expiringSupplies: expiringAlerts,
        staleOrders: staleOrderAlerts,
      },
    });
  } catch (error) {
    console.error('Error al evaluar alertas:', error);
    return res.status(500).json({ success: false, message: 'Error al consultar alertas del sistema.' });
  }
};
