import { Router } from 'express';
import {
  getSupplies,
  createSupply,
  registerPurchase,
  getPurchases,
} from '../controllers/supply.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Inventario de materias primas y compras
router.get('/', getSupplies);
router.post('/', authenticateJWT, createSupply);
router.post('/purchases', authenticateJWT, registerPurchase);
router.get('/purchases', getPurchases);

export default router;
