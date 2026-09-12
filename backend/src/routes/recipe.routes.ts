import { Router } from 'express';
import {
  getRecipesByProduct,
  addOrUpdateRecipeItem,
  deleteRecipeItem,
} from '../controllers/recipe.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Gestión de recetas / fichas técnicas de productos
router.get('/product/:productId', getRecipesByProduct);
router.post('/', authenticateJWT, addOrUpdateRecipeItem);
router.delete('/:id', authenticateJWT, deleteRecipeItem);

export default router;
