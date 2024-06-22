const express = require("express");
const router = express.Router({ mergeParams: true });

const commentRouter = require("./comments");

const post_controller = require("../controllers/postsController");

router.use("/:id/comments", commentRouter);

router.get("/", post_controller.posts_get);
router.get("/my-feed", post_controller.posts_my_feed_get);
router.get("/:id", post_controller.posts_get_one);

router.put("/:id/like", post_controller.posts_like);
router.put("/:id/dislike", post_controller.posts_dislike);

router.post("/", post_controller.posts_post);
router.put("/:id", post_controller.posts_put);
router.delete("/:id", post_controller.posts_delete);

module.exports = router;
