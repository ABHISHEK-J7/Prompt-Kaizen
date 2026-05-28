const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  // Only include the stack when we're explicitly in development. Any other
  // value (`undefined`, `'staging'`, `'test'`, typos like `'Production'`) is
  // treated as production so a misconfigured host never leaks stack traces
  // with absolute file paths to the client.
  const includeStack = process.env.NODE_ENV === 'development';
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: includeStack ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
