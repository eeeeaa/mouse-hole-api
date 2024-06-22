const express = require("express");
const router = express.Router({ mergeParams: true });

const commentRouter = require("./comments");

const post_controller = require("../controllers/postsController");

router.use("/:id/comments", commentRouter);

router.get("/", post_controller.posts_get);
router.get("/my-feed", post_controller.posts_my_feed_get);
router.get("/:id", post_controller.posts_get_one);

router.get("/:id/like", post_controller.posts_get_likes);
router.post("/:id/like/toggle", post_controller.posts_like);

router.post("/", post_controller.posts_post);
router.put("/:id", post_controller.posts_put);
router.delete("/:id", post_controller.posts_delete);

module.exports = router;
