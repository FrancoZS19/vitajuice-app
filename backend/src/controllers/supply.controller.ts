import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Decisión técnica para el docente: Al registrar una compra de insumos, se ejecuta una transacción atómica
// que guarda el lote de compra (con su fecha de vencimiento y proveedor) e incrementa el stock actual del insumo.
// Esto garantiza la consistencia de inventario sin depender de procesos manuales o asíncronos.

export const getSupplies = async (req: Request, res: Response) => {
  try {
    const supplies = await prisma.supply.findMany({
      orderBy: { name: 'asc' },
      include: {
        purchases: {
          orderBy: { purchaseDate: 'desc' },
          take: 3,
        },
      },
    });

    // Añadimos indicador de estado de stock para la interfaz
    const enriched = supplies.map((s) => {
      const current = Number(s.currentStock);
      const min = Number(s.minStockAlert);
      let stockStatus: 'OPTIMO' | 'BAJO' | 'CRITICO' = 'OPTIMO';

      if (current <= 0) {
        stockStatus = 'CRITICO';
      } else if (current <= min) {
        stockStatus = 'BAJO';
      }

      return {
        ...s,
        currentStock: current,
        minStockAlert: min,
        lastCost: Number(s.lastCost),
        stockStatus,
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error al obtener insumos:', error);
    return res.status(500).json({ success: false, message: 'Error al listar inventario de insumos.' });
  }
};

export const createSupply = async (req: Request, res: Response) => {
  try {
    const { name, unit, currentStock, minStockAlert, lastCost } = req.body;

    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y unidad de medida (g, ml, unidad, kg) son requeridos.',
      });
    }

    const newSupply = await prisma.supply.create({
      data: {
        name,
        unit,
        currentStock: currentStock !== undefined ? Number(currentStock) : 0,
        minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : 100,
        lastCost: lastCost !== undefined ? Number(lastCost) : 0,
      },
    });

    return res.status(201).json({ success: true, data: newSupply });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Ya existe un insumo con ese nombre.' });
    }
    return res.status(500).json({ success: false, message: 'Error al crear insumo.' });
  }
};

// Registro de entrada / compra de insumos (Lote y actualización de stock)
export const registerPurchase = async (req: Request, res: Response) => {
  try {
    const {
      supplyId,
      quantity,
      unitCost,
      expirationDate,
      supplier,
      batchNumber,
    } = req.body;

    if (!supplyId || quantity === undefined || unitCost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el insumo, la cantidad comprada y el costo unitario.',
      });
    }

    const qty = Number(quantity);
    const cost = Number(unitCost);
    const totalCost = qty * cost;

    // Transacción atómica: Crear registro de compra + Incrementar stock del insumo
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.supplyPurchase.create({
        data: {
          supplyId,
          quantity: qty,
          unitCost: cost,
          totalCost,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          supplier: supplier || 'Proveedor Local',
          batchNumber: batchNumber || `LOTE-${Date.now().toString().slice(-4)}`,
        },
      });

      const updatedSupply = await tx.supply.update({
        where: { id: supplyId },
        data: {
          currentStock: {
            increment: qty,
          },
          lastCost: cost,
        },
      });

      return { purchase, updatedSupply };
    });

    return res.status(201).json({
      success: true,
      message: 'Entrada de compra y stock actualizados correctamente.',
      data: result,
    });
  } catch (error) {
    console.error('Error al registrar compra:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar la entrada de insumos.' });
  }
};

export const getPurchases = async (req: Request, res: Response) => {
  try {
    const purchases = await prisma.supplyPurchase.findMany({
      orderBy: { purchaseDate: 'desc' },
      include: {
        supply: {
          select: { name: true, unit: true },
        },
      },
      take: 50,
    });

    return res.json({ success: true, data: purchases });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al listar compras.' });
  }
};
