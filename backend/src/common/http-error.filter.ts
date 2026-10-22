import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    let status = 500;
    let message: string | object = 'Internal server error';
    const candidate = error as { code?: string; type?: string; name?: string; driverError?: { code?: string } };
    const pgCode = candidate?.code || candidate?.driverError?.code;
    if (error instanceof HttpException) {
      status = error.getStatus();
      message = error.getResponse();
    } else if (candidate?.code === 'EBADCSRFTOKEN') {
      status = 403;
      message = 'Invalid or missing CSRF token';
    } else if (pgCode === '23505') {
      status = 409;
      message = 'A record with these details already exists';
    } else if (pgCode === '23503') {
      status = 404;
      message = 'Referenced record not found';
    } else if (pgCode === '23514' || pgCode === '22007' || pgCode === '22008') {
      status = 400;
      message = 'Invalid field values';
    } else if (candidate?.type === 'entity.parse.failed') {
      status = 400;
      message = 'Invalid JSON body';
    } else if (candidate?.type === 'entity.too.large') {
      status = 413;
      message = 'Request body too large';
    }
    if (status === 500) {
      this.logger.error(`Request failed [500]`, error instanceof Error ? error.stack : String(error));
    } else if (status >= 400) {
      console.warn(`[HTTP ${status}] ${typeof message === 'object' ? JSON.stringify(message) : message}`);
    }
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) return;
    if (status === 429) {
      response.setHeader('Retry-After', '60');
      message = 'Too many requests. Please wait a moment before trying again.';
    }
    response.status(status).json(typeof message === 'object' ? message : { statusCode: status, message });
  }
}
