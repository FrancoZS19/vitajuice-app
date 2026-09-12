import { Router } from 'express';
import { getSystemAlerts } from '../controllers/alert.controller';

const router = Router();

// Decisión técnica para el docente: Endpoint centralizado de alertas para consulta en tiempo real
router.get('/', getSystemAlerts);

export default router;
