const express = require("express");
const router = express.Router({ mergeParams: true });

const commentRouter = require("./comments");

router.use("/comments", commentRouter);
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

module.exports = router;
