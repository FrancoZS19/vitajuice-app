import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Decisión técnica para el docente: Al listar productos incluimos la relación con sus recetas e insumos,
// calculando en tiempo de consulta el costo teórico unitario (Costo de Producción).
// Esto permite que el frontend muestre el margen proyectado de cada shot directamente en el catálogo.

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        recipes: {
          include: {
            supply: {
              select: { id: true, name: true, unit: true, lastCost: true },
            },
          },
        },
      },
    });

    // Enriquecemos cada producto con su costo de producción calculado según su ficha técnica
    const enrichedProducts = products.map((prod) => {
      const productionCost = prod.recipes.reduce((acc, recipe) => {
        const costPerUnit = Number(recipe.supply.lastCost) || 0;
        const qtyNeeded = Number(recipe.quantityNeeded) || 0;
        return acc + costPerUnit * qtyNeeded;
      }, 0);

      const price = Number(prod.price);
      const unitMargin = price - productionCost;
      const marginPercentage = price > 0 ? (unitMargin / price) * 100 : 0;

      return {
        ...prod,
        price: Number(prod.price),
        productionCost: Number(productionCost.toFixed(2)),
        unitMargin: Number(unitMargin.toFixed(2)),
        marginPercentage: Number(marginPercentage.toFixed(1)),
      };
    });

    return res.json({ success: true, data: enrichedProducts });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({ success: false, message: 'Error al listar catálogo de productos.' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        recipes: {
          include: {
            supply: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener producto.' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, category, price, minStock } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y precio son campos obligatorios.',
      });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        category: category || 'SHOT',
        price: Number(price),
        minStock: minStock !== undefined ? Number(minStock) : 10,
        active: true,
      },
    });

    return res.status(201).json({ success: true, data: newProduct });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto registrado con ese nombre.',
      });
    }
    return res.status(500).json({ success: false, message: 'Error al registrar producto.' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, minStock, active } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(price !== undefined && { price: Number(price) }),
        ...(minStock !== undefined && { minStock: Number(minStock) }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al actualizar producto.' });
  }
};
