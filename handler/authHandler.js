const passport = require("passport");

exports.verifyAuth = passport.authenticate("jwt", { session: false });
