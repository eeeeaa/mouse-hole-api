const express = require("express");
const passport = require("passport");
const router = express.Router();

router.get("/error", (req, res) =>
  res.status(500).json({ message: "github login failed" })
);
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/auth/error" }),
  function (req, res) {
    res.redirect("/");
  }
);
router.post("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
