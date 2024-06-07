const express = require("express");
const router = express.Router();

const user_controller = require("../controllers/usersController");

router.get("/", user_controller.users_get);
router.get("/my-profile", user_controller.users_get_self);
router.get("/:id", user_controller.users_get_one);

router.delete("/:id", user_controller.users_delete);

module.exports = router;
