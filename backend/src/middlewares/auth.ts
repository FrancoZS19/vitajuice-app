import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Decisión técnica para el docente: Autenticación stateless mediante JWT (JSON Web Tokens).
// Permite que la API REST sea desacoplada y escalable, sin almacenar sesiones en memoria del servidor.

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: Token JWT no proporcionado o formato inválido.',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'vitajuice_secret_token_scrum_2026_isil';

  try {
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado. Por favor inicie sesión nuevamente.',
    });
  }
};
