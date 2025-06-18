import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  logger.error(`Error ${error.statusCode || 500}:`, {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Error de desarrollo vs producción
  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  } else {
    // Error de producción (sin detalles internos)
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.isOperational ? error.message : 'Error interno del servidor',
    });
  }
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}; 