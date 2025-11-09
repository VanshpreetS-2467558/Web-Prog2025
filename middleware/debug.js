


// Middleware for debug logging
export default function logger(req, res, next) {
  console.log(`Request URL: ${req.url} @ ${new Date().toLocaleString("nl-BE")}`);
  next();
}
