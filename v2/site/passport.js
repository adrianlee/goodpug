var passport = require("passport");
var SteamStrategy = require('passport-steam').Strategy;
var steam = require('steamidconvert')();
var db = require("./database");
var config = require("../config");

passport.use(new SteamStrategy({
    returnURL: config.passport.returnUrl,
    realm: config.passport.realm,
    apiKey: config.passport.apiKey
  },
  function(identifier, profile, done) {
    if (!profile)
      return done("No profile returned");

    var newProfile = {
      id: profile.id,
      displayName: profile.displayName,
      steamId: profile.id && steam.convertToText(profile.id),
      profileUrl: profile._json.profileurl,
      avatarSmall: profile.photos && profile.photos[0] && profile.photos[0].value,
      avatarMedium: profile.photos && profile.photos[1] && profile.photos[1].value,
      avatarBig: profile.photos && profile.photos[2] && profile.photos[2].value
    };

    db.Player.findOneAndUpdate({ id: profile.id }, newProfile, { upsert: true }, function (err, doc) {
      done(err, doc);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});