const express = require("express");
const router = express.Router();

const auth_controller = require("../controllers/authController");

router.post("/login", auth_controller.login_post);

router.post("/signup", auth_controller.signup_post);

module.exports = router;
