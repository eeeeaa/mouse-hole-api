exports.verifyAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/github");
  return next();
};
