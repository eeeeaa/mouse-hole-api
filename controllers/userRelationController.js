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

async function fetchFollowers(user, relationType) {
  const allFollowersOfUser = await UserRelationship.find(
    {
      user_id_second: user,
      relation_type: relationType,
    },
    "user_id_first"
  )
    .populate("user_id_first")
    .exec();
  return allFollowersOfUser.map((relation) => {
    return relation.user_id_first;
  });
}

async function fetchFollowing(user, relationType) {
  const allFollowersOfUser = await UserRelationship.find(
    {
      user_id_first: user,
      relation_type: relationType,
    },
    "user_id_second"
  )
    .populate("user_id_second")
    .exec();

  return allFollowersOfUser.map((relation) => {
    return relation.user_id_second;
  });
}

//---logged in user---

exports.get_my_followers = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    //get all users that follows this user
    const allFollowersOfUser = await fetchFollowers(req.user.id, "Follow");

    res.json({
      users: allFollowersOfUser,
    });
  }),
];

exports.get_my_followings = [
  verifyAuth,
  asyncHandler(async (req, res, next) => {
    //get all users that this user is following
    const allFollowingsOfUser = await fetchFollowing(req.user.id, "Follow");

    res.json({
      users: allFollowingsOfUser,
    });
  }),
];

exports.get_my_follow_status = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    //check if logged in user follows this user
    const relationship = await UserRelationship.findOne({
      user_id_first: req.user.id,
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
      user_id_first: req.user.id,
      user_id_second: req.params.id,
      relation_type: "Follow",
    });

    if (existRelationship) {
      return res.json({
        user_relationship: existRelationship,
      });
    }

    const relationship = new UserRelationship({
      user_id_first: req.user.id,
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
      user_id_first: req.user.id,
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
    //get all users that follows this user
    const allFollowersOfUser = await fetchFollowers(req.params.id, "Follow");

    res.json({
      users: allFollowersOfUser,
    });
  }),
];

exports.get_user_followings = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    //get all users that this user is following
    const allFollowingsOfUser = await fetchFollowing(req.params.id, "Follow");

    res.json({
      users: allFollowingsOfUser,
    });
  }),
];
