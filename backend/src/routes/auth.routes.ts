import { Router } from 'express';
import { login, getProfile } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Decisión técnica para el docente: Ruta pública para login y ruta protegida para validar la sesión actual
router.post('/login', login);
router.get('/profile', authenticateJWT, getProfile);

export default router;
