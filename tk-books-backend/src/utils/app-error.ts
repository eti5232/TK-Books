export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (code: string, message: string, details?: unknown): AppError =>
  new AppError(400, code, message, details);
export const unauthorized = (code: string, message: string): AppError => new AppError(401, code, message);
export const forbidden = (code: string, message: string): AppError => new AppError(403, code, message);
export const notFound = (message = 'לא נמצא / Not found', code = 'NOT_FOUND'): AppError =>
  new AppError(404, code, message);
export const conflict = (code: string, message: string): AppError => new AppError(409, code, message);
export const gone = (code: string, message: string): AppError => new AppError(410, code, message);
