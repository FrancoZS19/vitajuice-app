import { Router } from 'express';
import { getDashboardMetrics, exportOrdersCSV } from '../controllers/report.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Métricas de ventas, margen real y exportación de reportes
router.get('/dashboard', authenticateJWT, getDashboardMetrics);
router.get('/export-csv', exportOrdersCSV);

export default router;
