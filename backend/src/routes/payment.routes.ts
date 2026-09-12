import { Router } from 'express';
import { processCulqiPayment } from '../controllers/payment.controller';

const router = Router();

// Decisión técnica para el docente: Endpoint de integración con pasarela de pagos Culqi
router.post('/culqi-charge', processCulqiPayment);

export default router;
