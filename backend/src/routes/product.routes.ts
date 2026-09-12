import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
} from '../controllers/product.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Catálogo de productos (shots y jugos VitaJuice)
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authenticateJWT, createProduct);
router.put('/:id', authenticateJWT, updateProduct);

export default router;
