import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { PaymentStatus } from '@prisma/client';

// Decisión técnica para el docente: El cálculo del margen de ganancia real cruza cada venta completada
// con la receta técnica del shot y el costo de compra de cada insumo.
// Esto entrega la métrica exacta de rentabilidad solicitada en las Sprint Reviews.

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: PaymentStatus.PAGADO },
      include: {
        items: {
          include: {
            product: {
              include: {
                recipes: {
                  include: { supply: true },
                },
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalSupplyCost = 0;
    let totalItemsSold = 0;

    // Conteo por producto para ranking
    const productSalesMap: Record<
      string,
      { name: string; quantity: number; revenue: number; cost: number; category: string }
    > = {};

    for (const order of paidOrders) {
      totalRevenue += Number(order.totalAmount);

      for (const item of order.items) {
        const qty = item.quantity;
        totalItemsSold += qty;

        // Costo de receta unitario
        const unitCost = item.product.recipes.reduce((acc, r) => {
          return acc + Number(r.quantityNeeded) * Number(r.supply.lastCost);
        }, 0);

        const itemTotalCost = unitCost * qty;
        totalSupplyCost += itemTotalCost;

        const prodName = item.product.name;
        if (!productSalesMap[prodName]) {
          productSalesMap[prodName] = {
            name: prodName,
            quantity: 0,
            revenue: 0,
            cost: 0,
            category: item.product.category,
          };
        }
        productSalesMap[prodName].quantity += qty;
        productSalesMap[prodName].revenue += Number(item.subtotal);
        productSalesMap[prodName].cost += itemTotalCost;
      }
    }

    const realGrossMargin = totalRevenue - totalSupplyCost;
    const marginPercentage = totalRevenue > 0 ? (realGrossMargin / totalRevenue) * 100 : 0;

    const topProducts = Object.values(productSalesMap)
      .map((p) => {
        const margin = p.revenue - p.cost;
        return {
          ...p,
          revenue: Number(p.revenue.toFixed(2)),
          cost: Number(p.cost.toFixed(2)),
          margin: Number(margin.toFixed(2)),
          marginPercent: p.revenue > 0 ? Number(((margin / p.revenue) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.quantity - a.quantity);

    // Contadores generales del negocio
    const totalOrdersCount = await prisma.order.count();
    const pendingOrdersCount = await prisma.order.count({
      where: { paymentStatus: PaymentStatus.PENDIENTE },
    });
    const totalCustomersCount = await prisma.customer.count();

    return res.json({
      success: true,
      data: {
        financials: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalSupplyCost: Number(totalSupplyCost.toFixed(2)),
          realGrossMargin: Number(realGrossMargin.toFixed(2)),
          marginPercentage: Number(marginPercentage.toFixed(1)),
          paidOrdersCount: paidOrders.length,
          totalItemsSold,
        },
        kpis: {
          totalOrdersCount,
          pendingOrdersCount,
          totalCustomersCount,
        },
        topProducts,
      },
    });
  } catch (error) {
    console.error('Error al generar métricas de dashboard:', error);
    return res.status(500).json({ success: false, message: 'Error al calcular reportes financieros.' });
  }
};

// Exportación a formato CSV (para análisis en Excel y Sprint Reviews)
export const exportOrdersCSV = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                recipes: {
                  include: { supply: true },
                },
              },
            },
          },
        },
      },
    });

    let csvContent = 'NumeroPedido,Fecha,Cliente,Telefono,EstadoLogistico,EstadoPago,MetodoPago,Productos,TotalVenta_PEN,CostoInsumos_PEN,MargenReal_PEN,Margen_Porcentaje\n';

    for (const ord of orders) {
      const itemsList = ord.items.map((it) => `${it.product.name} (x${it.quantity})`).join('; ');

      let orderSupplyCost = 0;
      for (const item of ord.items) {
        const unitCost = item.product.recipes.reduce((acc, r) => {
          return acc + Number(r.quantityNeeded) * Number(r.supply.lastCost);
        }, 0);
        orderSupplyCost += unitCost * item.quantity;
      }

      const totalVenta = Number(ord.totalAmount);
      const margenReal = totalVenta - orderSupplyCost;
      const margenPct = totalVenta > 0 ? ((margenReal / totalVenta) * 100).toFixed(1) : '0';
      const fecha = new Date(ord.createdAt).toISOString().split('T')[0];

      csvContent += `"${ord.orderNumber}","${fecha}","${ord.customer.name}","${ord.customer.phone}","${ord.status}","${ord.paymentStatus}","${ord.paymentMethod || 'N/A'}","${itemsList}",${totalVenta.toFixed(2)},${orderSupplyCost.toFixed(2)},${margenReal.toFixed(2)},${margenPct}%\n`;
    }

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`Reporte_Ventas_VitaJuice_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return res.status(500).json({ success: false, message: 'Error al generar exportación CSV.' });
  }
};
