const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const CustomStrategy = require("passport-custom").Strategy;
const User = require("../models/user");

require("dotenv").config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URI,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const user = await User.findOne({ github_id: profile.id });
        if (!user) {
          //no user, create new user
          const newUser = new User({
            username: profile.username,
            display_name: profile.displayName,
            profile_url: profile._json.avatar_url,
            github_id: profile.id,
          });
          await newUser.save();
          return done(null, newUser);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new CustomStrategy(async function (req, done) {
    try {
      const user = await User.findOne({ github_id: "-1" });
      if (!user) {
        const newUser = new User({
          username: "example",
          display_name: "example",
          github_id: "-1",
        });
        await newUser.save();
        return done(null, newUser);
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);
