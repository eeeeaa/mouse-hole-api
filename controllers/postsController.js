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

const upload = require("../utils/multer");
const cloudinaryUtils = require("../utils/cloudinaryUtils");

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
  body("title")
    .trim()
    .isLength({ min: 1 })
    .withMessage("post title must not be empty")
    .escape(),
  body("content")
    .trim()
    .isLength({ min: 1 })
    .withMessage("post content must not be empty")
    .escape(),
  validationErrorHandler,
  upload.array("image", 5),
  asyncHandler(async (req, res, next) => {
    const imgs = [];
    if (req.files) {
      //upload multiple images

      req.files.forEach(async (file) => {
        const result = await cloudinaryUtils.cloudinaryUtils.PostImageUpload(
          file,
          crypto.randomUUID(),
          true
        );

        imgs.push(result.public_id);
      });
    }
    const post = new Post({
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,
      images: imgs,
    });

    await post.save();

    res.json({
      post: post,
    });
  }),
];

exports.posts_put = [
  verifyAuth,
  body("title")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1 })
    .withMessage("post title must not be empty")
    .escape(),
  body("content")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1 })
    .withMessage("post content must not be empty")
    .escape(),
  body("like_count").optional({ values: "falsy" }).isNumeric({ min: 0 }),
  validationErrorHandler,
  upload.array("image", 5),
  asyncHandler(async (req, res, next) => {
    const existPost = await Post.findById(req.params.id).exec();
    if (existPost === null) {
      const err = new Error("Post does not exist");
      err.status = 404;
      return next(err);
    }

    const imgs = [];
    if (req.files) {
      //upload multiple images

      req.files.forEach(async (file) => {
        const result = await cloudinaryUtils.cloudinaryUtils.PostImageUpload(
          file,
          crypto.randomUUID(),
          true
        );

        imgs.push(result.public_id);
      });

      //delete old images
      if (existPost.images) {
        existPost.images.forEach(async (image) => {
          await cloudinaryUtils.ImageDelete(image);
        });
      }
    }

    const post = {
      _id: req.params.id,
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,
      images: imgs,
      updated_at: Date.now(),
      like_count: req.body.like_count,
    };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, post, {
      new: true,
    });

    res.json({
      updatedPost,
    });
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

    //delete old images
    if (existPost.images) {
      existPost.images.forEach(async (image) => {
        await cloudinaryUtils.ImageDelete(image);
      });
    }

    res.json({
      deletedPost,
    });
  }),
];
