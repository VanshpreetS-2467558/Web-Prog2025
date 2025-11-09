


// helper functie voor pagina's waar inloggen nodig is
export function requireLogin(role) {
  return function(req, res, next) {
    if (!req.session.user) return res.redirect('/inloggen');       // eerst kijken of ingelogd is
    if (role && req.session.user.role !== role) return res.status(403).render("error_pages/403"); // controleerd op role
    next();
  }
}
