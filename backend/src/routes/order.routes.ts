import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from '../controllers/order.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Gestión de ventas y pedidos
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', authenticateJWT, createOrder);
router.patch('/:id/status', authenticateJWT, updateOrderStatus);

export default router;
