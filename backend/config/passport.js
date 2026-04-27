const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/userModel');
const { comparePassword } = require('../utils/bcrypt');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async function (email, password, done) {
        try {
          const user = await User.findOne({ email: email.toLowerCase().trim() });
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          const isValid = await comparePassword(password, user.password);
          if (!isValid) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
