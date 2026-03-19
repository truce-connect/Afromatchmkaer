// Centralized error formatting so the frontend sees consistent responses
const errorHandler = (err, _req, res, _next) => {
  console.error(err);

  const status = err.code === 'EBADCSRFTOKEN' ? 403 : err.statusCode || 500;
  const payload = {
    message:
      err.code === 'EBADCSRFTOKEN'
        ? 'Request blocked by CSRF protection.'
        : err.message || 'Something went wrong.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    ...(err.details && { details: err.details })
  };

  res.status(status).json(payload);
};

module.exports = errorHandler;
