import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Decisión técnica para el docente: La gestión de recetas (fichas técnicas) usa una clave compuesta única
// [productId, supplyId]. Permite vincular N insumos por shot con su respectivo gramaje o mililitros,
// asegurando que no se dupliquen insumos dentro de una misma receta.

export const getRecipesByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const recipes = await prisma.recipeItem.findMany({
      where: { productId },
      include: {
        supply: true,
      },
    });

    const totalCost = recipes.reduce((acc, item) => {
      return acc + Number(item.quantityNeeded) * Number(item.supply.lastCost);
    }, 0);

    return res.json({
      success: true,
      data: {
        items: recipes,
        productionCost: Number(totalCost.toFixed(2)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al consultar receta.' });
  }
};

export const addOrUpdateRecipeItem = async (req: Request, res: Response) => {
  try {
    const { productId, supplyId, quantityNeeded } = req.body;

    if (!productId || !supplyId || quantityNeeded === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el producto, el insumo y la cantidad requerida.',
      });
    }

    const item = await prisma.recipeItem.upsert({
      where: {
        productId_supplyId: {
          productId,
          supplyId,
        },
      },
      update: {
        quantityNeeded: Number(quantityNeeded),
      },
      create: {
        productId,
        supplyId,
        quantityNeeded: Number(quantityNeeded),
      },
      include: {
        supply: true,
      },
    });

    return res.json({
      success: true,
      message: 'Insumo agregado a la ficha técnica del producto.',
      data: item,
    });
  } catch (error) {
    console.error('Error al guardar item de receta:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar receta.' });
  }
};

export const deleteRecipeItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.recipeItem.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Insumo retirado de la receta exitosamente.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al eliminar insumo de la receta.' });
  }
};
