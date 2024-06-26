const asyncHandler = require("express-async-handler");
const { body } = require("express-validator");
const {
  validationErrorHandler,
  validIdErrorHandler,
} = require("../handler/validationErrorHandler");
const { verifyAuth } = require("../handler/authHandler");

const User = require("../models/user");
const PostRelationship = require("../models/postRelationship");
const CommentRelationship = require("../models/commentRelationship");
const Comment = require("../models/comment");
const Post = require("../models/post");

const upload = require("../utils/multer");
const cloudinaryUtils = require("../utils/cloudinaryUtils");

const { fetchFollowing } = require("./userRelationController");

const mongoose = require("mongoose");

const defaultPageLimit = 10;
const defaultPage = 0;

exports.posts_get = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const pageOptions = {
      page: parseInt(req.query.page, 10) || defaultPage,
      limit: parseInt(req.query.limit, 10) || defaultPageLimit,
    };

    const [count, allPosts] = await Promise.all([
      Post.countDocuments().exec(),
      Post.find()
        .populate("author", "username display_name profile_url")
        .sort({ updated_at: 1 })
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .exec(),
    ]);

    res.json({
      posts: allPosts,
      totalPages: Math.ceil(count / pageOptions.limit),
      currentPage: pageOptions.page,
    });
  }),
];

exports.posts_my_feed_get = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const { allFollowingsOfUser, totalPages, currentPage } =
      await fetchFollowing(req.user._id, "Follow", true, 0, 0);
    const pageOptions = {
      page: parseInt(req.query.page, 10) || defaultPage,
      limit: parseInt(req.query.limit, 10) || defaultPageLimit,
    };

    const feedIds = [...allFollowingsOfUser, req.user._id];

    const [count, myFeeds] = await Promise.all([
      Post.countDocuments({ author: { $in: feedIds } }).exec(),
      Post.find({ author: { $in: feedIds } })
        .populate("author", "username display_name profile_url")
        .sort({ updated_at: 1 })
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .exec(),
    ]);

    res.json({
      posts: myFeeds,
      totalPages: Math.ceil(count / pageOptions.limit),
      currentPage: pageOptions.page,
    });
  }),
];

exports.posts_user_post = [
  verifyAuth,
  body("user_id")
    .isLength({ min: 1 })
    .custom((input) => {
      return mongoose.Types.ObjectId.isValid(input);
    })
    .withMessage("invalid id")
    .escape(),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    const existUser = await User.findById(req.body.user_id).exec();

    if (existUser === null) {
      const err = new Error("user not found");
      err.status = 404;
      return next(err);
    }

    const pageOptions = {
      page: parseInt(req.query.page, 10) || defaultPage,
      limit: parseInt(req.query.limit, 10) || defaultPageLimit,
    };

    const [count, posts] = await Promise.all([
      Post.countDocuments({ author: req.body.user_id }).exec(),
      Post.find({ author: req.body.user_id })
        .populate("author", "username display_name profile_url")
        .sort({ updated_at: 1 })
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit),
    ]);

    res.json({
      posts: posts,
      totalPages: Math.ceil(count / pageOptions.limit),
      currentPage: pageOptions.page,
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

exports.posts_get_likes = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const existPost = await Post.findById(req.params.id).exec();
    if (existPost === null) {
      const err = new Error("Post does not exist");
      err.status = 404;
      return next(err);
    }
    const relationships = await PostRelationship.find({
      post: req.params.id,
      relation_type: "like",
    }).exec();
    let isUserLiked = false;
    if (relationships.length > 0) {
      for (const relationship of relationships) {
        if (relationship.user.toString() === req.user._id) {
          isUserLiked = true;
        }
      }
    }
    res.json({
      like_count: relationships.length,
      isUserLiked: isUserLiked,
    });
  }),
];

exports.posts_like = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const [existPost, existRelationship] = await Promise.all([
      Post.findById(req.params.id).exec(),
      PostRelationship.findOne({
        user: req.user._id,
        post: req.params.id,
        relation_type: "like",
      }).exec(),
    ]);

    if (existPost === null) {
      const err = new Error("Post does not exist");
      err.status = 404;
      return next(err);
    }

    let isUserLiked = false;

    if (existRelationship) {
      //TODO user already like -> remove like
      await PostRelationship.deleteOne({
        user: req.user._id,
        post: req.params.id,
        relation_type: "like",
      }).exec();

      isUserLiked = false;
    } else {
      //TODO user have not like -> add like
      const relationship = new PostRelationship({
        user: req.user._id,
        post: req.params.id,
        relation_type: "like",
      });
      await relationship.save();
      isUserLiked = true;
    }

    const relationships = await PostRelationship.find({
      post: req.params.id,
      relation_type: "like",
    }).exec();

    res.json({
      like_count: relationships.length,
      isUserLiked: isUserLiked,
    });
  }),
];

exports.posts_put = [
  verifyAuth,
  upload.array("image", 5),
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
  validationErrorHandler,
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
    const [deletedPost, comments, relations, commentRelationships] =
      await Promise.all([
        Post.findByIdAndDelete(req.params.id)
          .populate("author", "username display_name profile_url")
          .exec(),
        Comment.deleteMany({ post: req.params.id }).exec(),
        PostRelationship.deleteMany({ post: req.params.id }).exec(),
        CommentRelationship.deleteMany({ post: req.params.id }).exec(),
      ]);

    res.json({
      deletedPost,
    });
  }),
];
