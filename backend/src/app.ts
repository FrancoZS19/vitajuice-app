import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas de cada módulo
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import supplyRoutes from './routes/supply.routes';
import recipeRoutes from './routes/recipe.routes';
import orderRoutes from './routes/order.routes';
import alertRoutes from './routes/alert.routes';
import paymentRoutes from './routes/payment.routes';
import reportRoutes from './routes/report.routes';

dotenv.config();

const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Endpoint de verificación de estado del servidor
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'VitaJuice by Rena - Commercial Management API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Registro de rutas por módulo de negocio
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/supplies', supplyRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Manejador centralizado de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error no controlado en la API:', err);
  res.status(500).json({
    success: false,
    message: 'Ocurrió un error inesperado en el servidor.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
