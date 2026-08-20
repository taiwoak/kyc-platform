import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 400;
    let message = exception.message;

    if (exception.code === 'LIMIT_FILE_SIZE') {
      status = 413;
      message = 'Maximum file size is 2.0MB';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: status === 413 ? 'Payload Too Large' : 'Bad Request',
    });
  }
}
