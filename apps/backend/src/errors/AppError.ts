export class AppError extends Error {
  public success: boolean = false;
  
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errorDetails: any = null
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details: any = null) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details: any = null) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details: any = null) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found', details: any = null) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', details: any = null) {
    super(message, 409, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests', details: any = null) {
    super(message, 429, details);
  }
}
