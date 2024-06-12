const express = require("express");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const path = require("path");

const auth = require("../../routes/auth");

exports.getMockExpressApp = (route = null) => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "public")));

  //setup passport jwt
  require("../../utils/passport");

  if (route) {
    app.use("/", route);
  }

  app.use("/auth", auth);

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // send error information
    console.log(err.message);
    res.status(err.status || 500).json({ message: err.message });
  });

  return app;
};
