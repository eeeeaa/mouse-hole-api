const asyncHandler = require("express-async-handler");
const { validIdErrorHandler } = require("../handler/validationErrorHandler");
const { verifyAuth } = require("../handler/authHandler");

const User = require("../models/user");
const Comment = require("../models/comment");
const Post = require("../models/post");
const UserRelationship = require("../models/userRelationship");

exports.users_get = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const allUsers = await User.find()
      .sort({ username: 1 })
      .limit(req.query.limit)
      .exec();
    res.json({
      users: allUsers,
    });
  }),
];

exports.users_get_one = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).exec();
    if (user === null) {
      const err = new Error("user not found");
      err.status = 404;
      return next(err);
    }
    res.json({
      user: user,
    });
  }),
];

exports.users_get_self = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).exec();
    if (user === null) {
      const err = new Error("user not found");
      err.status = 404;
      return next(err);
    }
    res.json({
      user: user,
    });
  }),
];

exports.users_delete = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const existUser = await User.findById(req.params.id).exec();
    if (existUser === null) {
      const err = new Error("User does not exist, can't delete");
      err.status = 404;
      return next(err);
    }

    const [deletedUser, comments, posts, relationships] = await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Comment.deleteMany({ author: req.params.id }).exec(),
      Post.deleteMany({ author: req.params.id }).exec(),
      UserRelationship.deleteMany({
        $or: [
          { user_id_first: req.params.id },
          { user_id_second: req.params.id },
        ],
      }).exec(),
    ]);

    res.json({
      deletedUser,
    });
  }),
];
