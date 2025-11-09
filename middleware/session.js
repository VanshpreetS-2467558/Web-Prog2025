



// maakt user beschikbaar in alle EJS views
export default function sessionMiddleware(req, res, next) {
  res.locals.user = req.session.user;
  next();
}
