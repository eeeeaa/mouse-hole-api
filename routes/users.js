const express = require("express");
const router = express.Router();

const user_controller = require("../controllers/usersController");
const relation_controller = require("../controllers/userRelationController");

//user route
router.get("/", user_controller.users_get);
router.get("/my-profile", user_controller.users_get_self);
router.get("/:id", user_controller.users_get_one);

router.delete("/:id", user_controller.users_delete);

//relationship routes
router.get("/my-followers", relation_controller.get_my_followers);
router.get("/my-followings", relation_controller.get_my_followings);

router.get("/:id/my-follow-status", relation_controller.get_my_follow_status);
router.post("/:id/follow-user", relation_controller.follow_user);
router.delete("/:id/unfollow-user", relation_controller.unfollow_user);

router.get("/:id/followers", relation_controller.get_user_followers);
router.get("/:id/followings", relation_controller.get_user_followings);

module.exports = router;
