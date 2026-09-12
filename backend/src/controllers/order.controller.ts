import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

// Decisión técnica para el docente: Al confirmar el pago de un pedido, ejecutamos una transacción de base de datos
// (prisma.$transaction) que deduce automáticamente los insumos requeridos según la receta de cada shot vendido.
// Si un insumo no tiene suficiente stock físico en almacén, la transacción se revierte íntegramente (Rollback).

// Función auxiliar para descontar insumos de un pedido
export const deductSuppliesForOrder = async (tx: any, orderId: string) => {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              recipes: {
                include: {
                  supply: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) return;

  // Calculamos el total de cada insumo que se debe descontar
  const supplyDeductions: Record<string, { name: string; requiredQty: number; currentStock: number }> = {};

  for (const item of order.items) {
    const qtyOrdered = item.quantity;
    for (const recipe of item.product.recipes) {
      const supplyId = recipe.supplyId;
      const needed = Number(recipe.quantityNeeded) * qtyOrdered;

      if (!supplyDeductions[supplyId]) {
        supplyDeductions[supplyId] = {
          name: recipe.supply.name,
          requiredQty: 0,
          currentStock: Number(recipe.supply.currentStock),
        };
      }
      supplyDeductions[supplyId].requiredQty += needed;
    }
  }

  // Verificamos si hay suficiente stock y descontamos
  for (const [supplyId, info] of Object.entries(supplyDeductions)) {
    if (info.currentStock < info.requiredQty) {
      throw new Error(
        `Stock insuficiente del insumo "${info.name}". Disponible: ${info.currentStock}, requerido por el pedido: ${info.requiredQty}`
      );
    }

    await tx.supply.update({
      where: { id: supplyId },
      data: {
        currentStock: {
          decrement: info.requiredQty,
        },
      },
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus, search } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = status as OrderStatus;
    if (paymentStatus) whereClause.paymentStatus = paymentStatus as PaymentStatus;

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: String(search), mode: 'insensitive' } },
        { customer: { name: { contains: String(search), mode: 'insensitive' } } },
        { customer: { phone: { contains: String(search) } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, category: true },
            },
          },
        },
        payments: {
          select: { id: true, provider: true, transactionId: true, status: true, amount: true },
        },
      },
    });

    return res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    return res.status(500).json({ success: false, message: 'Error al consultar lista de pedidos.' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                recipes: {
                  include: {
                    supply: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al consultar pedido.' });
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items, // array of { productId, quantity }
      notes,
      deliveryDate,
      paymentMethod,
      markAsPaid,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El pedido debe incluir al menos un producto.',
      });
    }

    // 1. Obtener o crear cliente (útil para pedidos rápidos de WhatsApp)
    let finalCustomerId = customerId;

    if (!finalCustomerId) {
      if (!customerName || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar el cliente o ingresar nombre y teléfono para un nuevo cliente.',
        });
      }

      // Buscar si el cliente ya existe por teléfono
      let customer = await prisma.customer.findUnique({
        where: { phone: customerPhone.trim() },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            address: customerAddress || null,
          },
        });
      }
      finalCustomerId = customer.id;
    }

    // 2. Calcular precios y validar productos
    const productIds = items.map((it: any) => it.productId);
    const productsInDb = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(productsInDb.map((p) => [p.id, p]));

    let totalAmount = 0;
    const orderItemsData = items.map((it: any) => {
      const product = productMap.get(it.productId);
      if (!product) {
        throw new Error(`Producto no encontrado ID: ${it.productId}`);
      }
      const unitPrice = Number(product.price);
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const subtotal = unitPrice * quantity;
      totalAmount += subtotal;

      return {
        productId: product.id,
        quantity,
        unitPrice,
        subtotal,
      };
    });

    // Generar correlativo de pedido legible (ej. VJ-2026-004)
    const countToday = await prisma.order.count();
    const orderNumber = `VJ-${new Date().getFullYear()}-${String(countToday + 1).padStart(4, '0')}`;

    const isPaid = Boolean(markAsPaid);
    const paymentStatus: PaymentStatus = isPaid ? PaymentStatus.PAGADO : PaymentStatus.PENDIENTE;
    const orderStatus: OrderStatus = isPaid ? OrderStatus.EN_PREPARACION : OrderStatus.PENDIENTE;

    // 3. Transacción atómica: Crear Pedido + Items + Descontar Stock si se marca como pagado
    const createdOrder = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: finalCustomerId,
          userId: req.user?.id || null,
          status: orderStatus,
          paymentStatus,
          totalAmount,
          paymentMethod: paymentMethod || (isPaid ? 'EFECTIVO' : null),
          notes: notes || null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      });

      // Si el pedido nace como PAGADO, descontar inmediatamente los insumos
      if (isPaid) {
        await deductSuppliesForOrder(tx, newOrder.id);
      }

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: isPaid
        ? 'Pedido registrado y pagado con éxito. Insumos descontados de almacén.'
        : 'Pedido registrado con éxito en estado pendiente.',
      data: createdOrder,
    });
  } catch (error: any) {
    console.error('Error al crear pedido:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al procesar el pedido.',
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, paymentMethod } = req.body;

    const currentOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!currentOrder) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
    }

    const wasPaid = currentOrder.paymentStatus === PaymentStatus.PAGADO;
    const willBePaid = paymentStatus === PaymentStatus.PAGADO;

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          ...(status && { status: status as OrderStatus }),
          ...(paymentStatus && { paymentStatus: paymentStatus as PaymentStatus }),
          ...(paymentMethod && { paymentMethod }),
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // Si pasa de NO PAGADO a PAGADO -> Descontar stock automáticamente
      if (!wasPaid && willBePaid) {
        await deductSuppliesForOrder(tx, id);
      }

      return order;
    });

    return res.json({
      success: true,
      message: !wasPaid && willBePaid
        ? 'Estado de pago actualizado a PAGADO. Insumos descontados de almacén.'
        : 'Pedido actualizado exitosamente.',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error al actualizar pedido:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar el estado del pedido.',
    });
  }
};
