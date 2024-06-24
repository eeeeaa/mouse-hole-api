const asyncHandler = require("express-async-handler");
const { body } = require("express-validator");
const {
  validationErrorHandler,
  validIdErrorHandler,
  validCommentIdErrorHandler,
} = require("../handler/validationErrorHandler");
const { verifyAuth } = require("../handler/authHandler");

const User = require("../models/user");
const CommentRelationship = require("../models/commentRelationship");
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
exports.comments_get_likes = [
  verifyAuth,
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

    const relationships = await CommentRelationship.find({
      post: req.params.id,
      comment: req.params.commentId,
      relation_type: "like",
    });
    let isUserLiked = false;
    if (relationships.length > 0) {
      for (const relationship of relationships) {
        if (relationship.user.toString() === req.user._id) isUserLiked = true;
      }
    }

    res.json({
      like_count: relationships.length,
      isUserLiked: isUserLiked,
    });
  }),
];
exports.comments_like = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const [existPost, existComment, existRelationship] = await Promise.all([
      Post.findById(req.params.id).exec(),
      Comment.findById(req.params.commentId).exec(),
      CommentRelationship.findOne({
        user: req.user._id,
        post: req.params.id,
        comment: req.params.commentId,
        relation_type: "like",
      }).exec(),
    ]);

    if (existPost === null || existComment === null) {
      const err = new Error("Post or comment does not exist");
      err.status = 404;
      return next(err);
    }
    let isUserLiked = false;
    if (existRelationship) {
      //remove like
      await CommentRelationship.deleteOne({
        user: req.user._id,
        post: req.params.id,
        comment: req.params.commentId,
        relation_type: "like",
      }).exec();
      isUserLiked = false;
    } else {
      //add like
      const relationship = new CommentRelationship({
        user: req.user._id,
        post: req.params.id,
        comment: req.params.commentId,
        relation_type: "like",
      });

      await relationship.save();
      isUserLiked = true;
    }

    const relationships = await CommentRelationship.find({
      post: req.params.id,
      comment: req.params.commentId,
      relation_type: "like",
    }).exec();

    res.json({
      like_count: relationships.length,
      isUserLiked: isUserLiked,
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

    const [deletedComment, relationships] = await Promise.all([
      Comment.findByIdAndDelete(req.params.commentId).exec(),
      CommentRelationship.deleteMany({ comment: req.params.commentId }).exec(),
    ]);

    res.json({
      deletedComment,
    });
  }),
];
