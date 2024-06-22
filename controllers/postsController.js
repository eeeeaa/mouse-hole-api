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

const { fetchFollowing } = require("./userRelationController");

exports.posts_get = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const allPosts = await Post.find()
      .populate("author", "username display_name profile_url")
      .limit(req.query.limit)
      .exec();

    res.json({
      posts: allPosts,
    });
  }),
];

exports.posts_my_feed_get = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const allFollowingsOfUser = await fetchFollowing(
      req.user._id,
      "Follow",
      true
    );

    const feedIds = [...allFollowingsOfUser, req.user._id];

    const myFeeds = await Post.find({ author: { $in: feedIds } })
      .populate("author", "username display_name profile_url")
      .limit(req.query.limit)
      .exec();

    res.json({
      posts: myFeeds,
    });
  }),
];

exports.posts_get_one = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
      .populate("author", "username display_name profile_url")
      .exec();
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
  upload.array("image", 5),
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
  asyncHandler(async (req, res, next) => {
    const imgs = [];
    const urls = [];
    if (req.files) {
      if (req.files.length > 0) {
        //upload multiple images
        for (const file of req.files) {
          const result = await cloudinaryUtils.PostImageUpload(
            file,
            crypto.randomUUID(),
            true
          );

          imgs.push(result.public_id);
          urls.push(cloudinaryUtils.getImageUrl(result.public_id, 500));
        }
      }
    }
    const post = new Post({
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,
      images: imgs,
      image_urls: urls,
    });

    await post.save();

    const result = await post.populate(
      "author",
      "username display_name profile_url"
    );

    res.json({
      post: result,
    });
  }),
];

exports.posts_like = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const existPost = await Post.findById(req.params.id).exec();
    if (existPost === null) {
      const err = new Error("Post does not exist");
      err.status = 404;
      return next(err);
    }

    const post = {
      like_count: existPost.like_count + 1,
    };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, post, {
      new: true,
    })
      .populate("author", "username display_name profile_url")
      .exec();

    res.json({
      updatedPost,
    });
  }),
];
exports.posts_dislike = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const existPost = await Post.findById(req.params.id).exec();
    if (existPost === null) {
      const err = new Error("Post does not exist");
      err.status = 404;
      return next(err);
    }

    const post = {
      like_count: existPost.like_count > 0 ? existPost.like_count - 1 : 0,
    };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, post, {
      new: true,
    })
      .populate("author", "username display_name profile_url")
      .exec();

    res.json({
      updatedPost,
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
    const urls = [];
    if (req.files) {
      if (req.files.length > 0) {
        //delete old images
        if (existPost.images) {
          if (existPost.images.length > 0) {
            for (const image of existPost.images) {
              await cloudinaryUtils.ImageDelete(image);
            }
          }
        }
        //upload multiple images
        for (const file of req.files) {
          const result = await cloudinaryUtils.PostImageUpload(
            file,
            crypto.randomUUID(),
            true
          );

          imgs.push(result.public_id);
          urls.push(cloudinaryUtils.getImageUrl(result.public_id, 500));
        }
      }
    }

    const post = {
      _id: req.params.id,
      author: req.user._id,
      title: req.body.title,
      content: req.body.content,
      images: imgs,
      urls: urls,
      updated_at: Date.now(),
      like_count: req.body.like_count,
    };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, post, {
      new: true,
    })
      .populate("author", "username display_name profile_url")
      .exec();

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

    //delete old images
    if (existPost.images) {
      if (existPost.images.length > 0) {
        for (const image of existPost.images) {
          await cloudinaryUtils.ImageDelete(image);
        }
      }
    }
    const [deletedPost, comments] = await Promise.all([
      Post.findByIdAndDelete(req.params.id)
        .populate("author", "username display_name profile_url")
        .exec(),
      Comment.deleteMany({ post: req.params.id }).exec(),
    ]);

    res.json({
      deletedPost,
    });
  }),
];
