/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(err.stack);

  // Get status code (default to 500 if not set)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Set response status code
  res.status(statusCode);

  // Send error response
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
    error: {
      name: err.name,
      code: err.code,
    },
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
