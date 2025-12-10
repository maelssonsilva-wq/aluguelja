const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Estratégia JWT para proteger rotas
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
  try {
    const user = await User.findById(jwt_payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Estratégia Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Verifica se o usuário já existe
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // Atualiza último login
        user.lastLogin = Date.now();
        await user.save();
        return done(null, user);
      }

      // Verifica se existe usuário com o mesmo email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Vincula conta Google ao usuário existente
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.isEmailVerified = true;
        user.lastLogin = Date.now();
        await user.save();
        return done(null, user);
      }

      // Cria novo usuário
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value,
        isEmailVerified: true,
        lastLogin: Date.now()
      });

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Serialização (não necessário para API REST, mas útil para sessões)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
