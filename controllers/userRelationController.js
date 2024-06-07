const asyncHandler = require("express-async-handler");
const { body } = require("express-validator");
const {
  validationErrorHandler,
  validIdErrorHandler,
} = require("../handler/validationErrorHandler");
const { verifyAuth, validIdErrorHandler } = require("../handler/authHandler");
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

async function createRelationship(firstUser, secondUser, relationType) {
  const relationship = new UserRelationship({
    user_id_first: firstUser,
    user_id_second: secondUser,
    relation_type: relationType,
  });

  await relationship.save();
  return relationship;
}

async function updateRelationship(firstUser, secondUser, relationTypeToBe) {
  const existRelationship = await UserRelationship.find({
    user_id_first: firstUser,
    user_id_second: secondUser,
  }).exec();

  if (existRelationship === null) {
    return null;
  }

  if (existRelationship.relation_type === relationTypeToBe) {
    return existRelationship;
  } else {
    const userRelationship = new UserRelationship({
      _id: existRelationship._id,
      user_id_first: firstUser,
      user_id_second: secondUser,
      relation_type: relationTypeToBe,
    });
    const updatedRelationship = await UserRelationship.findByIdAndUpdate(
      existRelationship._id,
      userRelationship,
      { new: true }
    );
    return updatedRelationship;
  }
}

//--User routes--
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

exports.get_user_blocks = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    //get all users that blocks this user
    const allFollowersOfUser = await fetchFollowers(req.params.id, "Block");

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
    const allFollowersOfUser = await fetchFollowing(req.params.id, "Follow");

    res.json({
      users: allFollowersOfUser,
    });
  }),
];

exports.get_user_blockings = [
  verifyAuth,
  validIdErrorHandler,
  asyncHandler(async (req, res, next) => {
    //get all users that this user is blocking
    const allFollowersOfUser = await fetchFollowing(req.params.id, "Block");

    res.json({
      users: allFollowersOfUser,
    });
  }),
];

exports.follow_user = [
  verifyAuth,
  validIdErrorHandler,
  body("user_id_to_follow")
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("invalid user id"),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    const existRelationship = await UserRelationship.find({
      user_id_first: firstUser,
      user_id_second: secondUser,
    }).exec();

    if (existRelationship !== null) {
      const err = new Error("user already exist");
      err.status = 404;
      return next(err);
    }

    const relationship = await createRelationship(
      req.params.id,
      req.body.user_id_to_follow,
      "Follow"
    );

    res.json({
      user_relationship: relationship,
    });
  }),
];

exports.block_user = [
  verifyAuth,
  validIdErrorHandler,
  body("user_id_to_block")
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("invalid user id"),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    const existRelationship = await UserRelationship.find({
      user_id_first: firstUser,
      user_id_second: secondUser,
    }).exec();

    if (existRelationship !== null) {
      const err = new Error("user already exist");
      err.status = 404;
      return next(err);
    }

    const relationship = await createRelationship(
      req.params.id,
      req.body.user_id_to_block,
      "Block"
    );

    res.json({
      user_relationship: relationship,
    });
  }),
];

exports.user_relationship_update = [
  verifyAuth,
  validIdErrorHandler,
  body("user_id_to_follow")
    .custom((value) => {
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage("invalid user id"),
  body("relation_type")
    .custom((value) => {
      return value === "Follow" || value === "Block";
    })
    .withMessage("invalid relationship type"),
  validationErrorHandler,
  asyncHandler(async (req, res, next) => {
    const relationship = await updateRelationship(
      req.params.id,
      req.body.user_id_to_follow,
      req.body.relation_type
    );

    if (relationship === null) {
      const err = new Error("relationship not found");
      err.status = 404;
      return next(err);
    }

    return res.json({
      user_relationship: relationship,
    });
  }),
];
