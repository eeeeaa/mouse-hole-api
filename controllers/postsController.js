const asyncHandler = require("express-async-handler");
const { body } = require("express-validator");
const {
  validationErrorHandler,
  validIdErrorHandler,
} = require("../handler/validationErrorHandler");
const { verifyAuth } = require("../handler/authHandler");

const User = require("../models/user");
const Comment = require("../models/comment");
const Post = require("../models/post");

exports.posts_get = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const allPosts = await Post.find().limit(req.query.limit).exec();

    res.json({
      posts: allPosts,
    });
  }),
];

exports.posts_get_one = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).exec();
    if (post === null) {
      const err = new Error("post not found");
      err.status = 404;
      return next(err);
    }
    res.json({
      post: post,
    });
  }),
];

exports.posts_post = [
  verifyAuth,
  body("content")
    .trim()
    .isLength({ min: 1 })
    .withMessage("post must not be empty")
    .escape(),
  body("images").optional({ values: "falsy" }).isArray({ min: 1 }),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    const post = new Post({
      author: req.user._id,
      content: req.body.content,
      images: req.body.images,
    });
  }),
];

exports.posts_put = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    res.send("NOT IMPLEMENTED: put post");
  }),
];

exports.posts_delete = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const existPost = await Post.findById(req.params.id).exec();
    if (existPost === null) {
      const err = new Error("Post does not exist, can't delete");
      err.status = 404;
      return next(err);
    }

    const [deletedPost, comments] = await Promise.all([
      Post.findByIdAndDelete(req.params.id),
      Comment.deleteMany({ post: req.params.id }).exec(),
    ]);

    req.json({
      deletedPost,
    });
  }),
];
