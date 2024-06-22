const express = require("express");
const router = express.Router({ mergeParams: true });

const comment_controller = require("../controllers/commentController");

router.get("/", comment_controller.comments_get);
router.get("/:commentId", comment_controller.comments_get_one);

router.put("/:commentId/like", comment_controller.comments_like);
router.put("/:commentId/dislike", comment_controller.comments_dislike);

router.post("/", comment_controller.comments_post);
router.put("/:commentId", comment_controller.comments_put);
router.delete("/:commentId", comment_controller.comments_delete);

module.exports = router;
