const asyncHandler = require("express-async-handler");
const { body } = require("express-validator");
const {
  validationErrorHandler,
  validIdErrorHandler,
} = require("../handler/validationErrorHandler");
const { verifyAuth } = require("../handler/authHandler");
const mongoose = require("mongoose");

const User = require("../models/user");
const UserRelationship = require("../models/userRelationship");

const defaultPageLimit = 10;
const defaultPage = 0;

async function fetchFollowers(user, relationType, page = 0, limit = 10) {
  const [count, allFollowersOfUser] = await Promise.all([
    UserRelationship.countDocuments({
      user_id_second: user,
      relation_type: relationType,
    }).exec(),
    UserRelationship.find(
      {
        user_id_second: user,
        relation_type: relationType,
      },
      "user_id_first"
    )
      .populate("user_id_first", "username display_name profile_url")
      .skip(page * limit)
      .limit(limit)
      .exec(),
  ]);

  return {
    allFollowersOfUser: allFollowersOfUser.map((relation) => {
      return relation.user_id_first;
    }),
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  };
}

exports.fetchFollowing = async (
  user,
  relationType,
  onlyId = false,
  page = 0,
  limit = 10
) => {
  let allFollowingsOfUser = [];
  const count = await UserRelationship.countDocuments({
    user_id_first: user,
    relation_type: relationType,
  }).exec();

  if (onlyId) {
    allFollowingsOfUser = await UserRelationship.find(
      {
        user_id_first: user,
        relation_type: relationType,
      },
      "user_id_second"
    )
      .skip(page * limit)
      .limit(limit)
      .exec();
  } else {
    allFollowingsOfUser = await UserRelationship.find(
      {
        user_id_first: user,
        relation_type: relationType,
      },
      "user_id_second"
    )
      .populate("user_id_second", "username display_name profile_url")
      .skip(page * limit)
      .limit(limit)
      .exec();
  }

  return {
    allFollowingsOfUser: allFollowingsOfUser.map((relation) => {
      return relation.user_id_second;
    }),
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  };
};

//---logged in user---

exports.get_my_followers = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const pageOptions = {
      page: parseInt(req.query.page, 10) || defaultPage,
      limit: parseInt(req.query.limit, 10) || defaultPageLimit,
    };
    //get all users that follows this user
    const { allFollowersOfUser, totalPages, currentPage } =
      await fetchFollowers(
        req.user._id,
        "Follow",
        pageOptions.page,
        pageOptions.limit
      );

    res.json({
      users: allFollowersOfUser,
      totalPages: totalPages,
      currentPage: currentPage,
    });
  }),
];

exports.get_my_followings = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    const pageOptions = {
      page: parseInt(req.query.page, 10) || defaultPage,
      limit: parseInt(req.query.limit, 10) || defaultPageLimit,
    };
    //get all users that this user is following
    const { allFollowingsOfUser, totalPages, currentPage } =
      await this.fetchFollowing(
        req.user._id,
        "Follow",
        false,
        pageOptions.page,
        pageOptions.limit
      );

    res.json({
      users: allFollowingsOfUser,
      totalPages: totalPages,
      currentPage: currentPage,
    });
  }),
];

exports.get_my_follow_status = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    //check if logged in user follows this user
    const relationship = await UserRelationship.findOne({
      user_id_first: req.user._id,
      user_id_second: req.params.id,
      relation_type: "Follow",
    }).exec();

    //just returns null if no relationship
    res.json({
      user_relationship: relationship,
    });
  }),
];

exports.follow_user = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    //follow user
    //if relationship already exist -> return that relationship
    //if relationship doesn't exist -> create new relationship

    const existRelationship = await UserRelationship.findOne({
      user_id_first: req.user._id,
      user_id_second: req.params.id,
      relation_type: "Follow",
    });

    if (existRelationship) {
      return res.json({
        user_relationship: existRelationship,
      });
    }

    const relationship = new UserRelationship({
      user_id_first: req.user._id,
      user_id_second: req.params.id,
      relation_type: "Follow",
    });

    await relationship.save();

    return res.json({
      user_relationship: relationship,
    });
  }),
];

exports.unfollow_user = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    //delete relationship
    const existRelationship = await UserRelationship.findOne({
      user_id_first: req.user._id,
      user_id_second: req.params.id,
      relation_type: "Follow",
    });

    if (existRelationship === null) {
      const err = new Error("relationship not found");
      err.status = 404;
      return next(err);
    }

    const deletedRelationship = await UserRelationship.findByIdAndDelete(
      existRelationship._id
    );

    return res.json({
      user_relationship: deletedRelationship,
    });
  }),
];

//---any users---

exports.get_user_followers = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const pageOptions = {
      page: parseInt(req.query.page, 10) || defaultPage,
      limit: parseInt(req.query.limit, 10) || defaultPageLimit,
    };
    //get all users that follows this user
    const { allFollowersOfUser, totalPages, currentPage } =
      await fetchFollowers(
        req.params.id,
        "Follow",
        pageOptions.page,
        pageOptions.limit
      );

    res.json({
      users: allFollowersOfUser,
      totalPages: totalPages,
      currentPage: currentPage,
    });
  }),
];

exports.get_user_followings = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    const pageOptions = {
      page: parseInt(req.query.page, 10) || defaultPage,
      limit: parseInt(req.query.limit, 10) || defaultPageLimit,
    };
    //get all users that this user is following
    const { allFollowingsOfUser, totalPages, currentPage } =
      await this.fetchFollowing(
        req.params.id,
        "Follow",
        false,
        pageOptions.page,
        pageOptions.limit
      );

    res.json({
      users: allFollowingsOfUser,
      totalPages: totalPages,
      currentPage: currentPage,
    });
  }),
];
