function errorHandler(err, req, res, _next) {
  console.error(err);

  const statusCode = err.statusCode || 500;

  const body = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId || null,
    status: statusCode,
    error: err.errorLabel || 'Internal Server Error',
    message: err.message || 'Internal server error',
    path: req.originalUrl,
  };

  res.locals.errorBody = body;
  res.status(statusCode).json(body);
}

class UserAlreadyExists extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserAlreadyExists';
    this.statusCode = 409;
    this.errorLabel = 'User Already Exists';
  }
}

class ResourceNotFound extends Error {
  constructor(message) {
    super(message);
    this.name = 'ResourceNotFound';
    this.statusCode = 404;
    this.errorLabel = 'Resource Not Found';
  }
}

class InvalidToken extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidToken';
    this.statusCode = 401;
    this.errorLabel = 'Invalid Token';
  }
}

class EmailNotVerified extends Error {
  constructor(message) {
    super(message);
    this.name = 'EmailNotVerified';
    this.statusCode = 403;
    this.errorLabel = 'Email Not Verified';
  }
}

class BadRequest extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequest';
    this.statusCode = 400;
    this.errorLabel = 'Bad Request';
  }
}

class Forbidden extends Error {
  constructor(message) {
    super(message);
    this.name = 'Forbidden';
    this.statusCode = 403;
    this.errorLabel = 'Forbidden';
  }
}

module.exports = { errorHandler, UserAlreadyExists, ResourceNotFound, InvalidToken, EmailNotVerified, BadRequest, Forbidden };
