const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { body } = require("express-validator");
const { validationErrorHandler } = require("../handler/validationErrorHandler");
const passport = require("passport");
const { getHash } = require("../utils/passwordUtils");
const User = require("../models/user");
require("dotenv").config();

exports.login_post = [
  body("username")
    .trim()
    .isLength({ min: 1 })
    .withMessage("username must not be empty")
    .escape(),
  body("password")
    .trim()
    .isLength({ min: 1 })
    .withMessage("password must not be empty")
    .escape(),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err || !user) {
        return next(err);
      }
      if (!user) {
        const error = new Error("no user found");
        error.status = 404;
        return next(error);
      }
      req.login(user, { session: false }, (err) => {
        if (err) {
          next(err);
        }
        // generate a signed son web token with the contents of user object and return it in the response
        const token = jwt.sign({ user }, process.env.SECRET, {
          expiresIn: "3h",
        });
        return res.json({
          token,
        });
      });
    })(req, res);
  }),
];

//for normal signup of user
exports.signup_post = [
  body("username")
    .trim()
    .isLength({ min: 1 })
    .withMessage("username must not be empty")
    .escape(),
  body("password")
    .trim()
    .isLength({ min: 1 })
    .withMessage("password must not be empty")
    .escape(),
  body("password_confirm")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("password does not match"),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    const hash = await getHash(req.body.password);
    const existUser = await User.findOne({ username: req.body.username });

    if (existUser) {
      const err = new Error("User already exists");
      err.status = 409;
      return next(err);
    }
    const user = new User({
      username: req.body.username,
      password: hash,
    });

    await user.save();
    res.json({
      user,
    });
  }),
];
