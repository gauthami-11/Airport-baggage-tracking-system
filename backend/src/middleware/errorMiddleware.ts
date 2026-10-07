import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error.';
  res.status(status).json({ message });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
