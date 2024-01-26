// Handling APIError by Using Node API Error classes which trace errors

class APIError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success =false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
      // tells where errors are located
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { APIError };
