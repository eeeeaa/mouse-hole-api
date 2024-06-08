const asyncHandler = require("express-async-handler");
const { body } = require("express-validator");
const {
  validationErrorHandler,
  validIdErrorHandler,
  validCommentIdErrorHandler,
} = require("../handler/validationErrorHandler");
const { verifyAuth } = require("../handler/authHandler");

const User = require("../models/user");
const Comment = require("../models/comment");
const Post = require("../models/post");

exports.comments_get = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const [existPost, allCommentsByPost] = await Promise.all([
      Post.findById(req.params.id).exec(),
      Comment.find({ post: req.params.id }).limit(req.query.limit).exec(),
    ]);
    if (existPost === null) {
      const err = new Error("Post does not exist");
      err.status = 404;
      return next(err);
    }

    res.json({
      comments: allCommentsByPost,
    });
  }),
];

exports.comments_get_one = [
  verifyAuth,
  validIdErrorHandler,
  validCommentIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const [existPost, comment] = await Promise.all([
      Post.findById(req.params.id).exec(),
      Comment.findById(req.params.commentId).exec(),
    ]);

    if (existPost === null || comment === null) {
      const err = new Error("Post or comment does not exist");
      err.status = 404;
      return next(err);
    }

    res.json({
      comment,
    });
  }),
];

exports.comments_post = [
  verifyAuth,
  validIdErrorHandler,
  body("message")
    .trim()
    .isLength({ min: 1 })
    .withMessage("message must not be empty")
    .escape(),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    const existPost = await Post.findById(req.params.id).exec();
    if (existPost === null) {
      const err = new Error("Post does not exist");
      err.status = 404;
      return next(err);
    }

    const comment = new Comment({
      author: req.user._id,
      post: req.params.id,
      message: req.body.message,
    });

    await comment.save();

    res.json({
      comment,
    });
  }),
];

exports.comments_put = [
  verifyAuth,
  validIdErrorHandler,
  validCommentIdErrorHandler,
  body("message")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1 })
    .withMessage("message must not be empty")
    .escape(),
  body("like_count").optional({ values: "falsy" }).isNumeric({ min: 0 }),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    const [existPost, existComment] = await Promise.all([
      Post.findById(req.params.id).exec(),
      Comment.findById(req.params.commentId).exec(),
    ]);

    if (existPost === null || existComment === null) {
      const err = new Error("Post or comment does not exist");
      err.status = 404;
      return next(err);
    }

    const comment = {
      _id: req.params.commentId,
      message: req.body.message,
      updated_at: Date.now(),
      like_count: req.body.like_count,
    };

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      comment,
      { new: true }
    );

    res.json({
      updatedComment,
    });
  }),
];

exports.comments_delete = [
  verifyAuth,
  validIdErrorHandler,
  validCommentIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const [existPost, existComment] = await Promise.all([
      Post.findById(req.params.id).exec(),
      Comment.findById(req.params.commentId).exec(),
    ]);

    if (existPost === null || existComment === null) {
      const err = new Error("Post or comment does not exist");
      err.status = 404;
      return next(err);
    }

    const deletedComment = await Comment.findByIdAndDelete(
      req.params.commentId
    );

    res.json({
      deletedComment,
    });
  }),
];
