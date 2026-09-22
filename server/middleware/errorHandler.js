export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must contain valid JSON.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large.' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: 'Task validation failed.' });
  }

  console.error('An unexpected API error occurred.');
  res.status(500).json({ message: 'An unexpected server error occurred.' });
}
