const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const configurePassport = () => {
    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id).select('-passwordHash');
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Local Strategy (email/password)
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email: email.toLowerCase() });

                if (!user) {
                    return done(null, false, { message: 'Invalid email or password' });
                }

                if (user.provider !== 'local') {
                    return done(null, false, {
                        message: `Please login with ${user.provider}`
                    });
                }

                const isMatch = await bcrypt.compare(password, user.passwordHash);

                if (!isMatch) {
                    return done(null, false, { message: 'Invalid email or password' });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    ));

    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
                scope: ['profile', 'email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists
                    let user = await User.findOne({
                        $or: [
                            { providerId: profile.id, provider: 'google' },
                            { email: profile.emails[0].value }
                        ]
                    });

                    if (user) {
                        // Always update avatar from Google profile to keep it fresh
                        if (profile.photos && profile.photos[0]) {
                            user.avatar = profile.photos[0].value;
                        }

                        // Update provider info if they signed up with email first
                        if (user.provider === 'local') {
                            user.provider = 'google';
                            user.providerId = profile.id;
                            user.emailVerified = true;
                        }
                        await user.save();
                        return done(null, user);
                    }

                    // Create new user
                    user = await User.create({
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                        provider: 'google',
                        providerId: profile.id,
                        emailVerified: true
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        ));
    }

    // GitHub OAuth Strategy
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        passport.use(new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
                scope: ['user:email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.local`;

                    // Check if user already exists
                    let user = await User.findOne({
                        $or: [
                            { providerId: profile.id, provider: 'github' },
                            { email: email }
                        ]
                    });

                    if (user) {
                        // Update provider info if they signed up with email first
                        if (user.provider === 'local') {
                            user.provider = 'github';
                            user.providerId = profile.id;
                            user.emailVerified = true;
                            if (profile.photos && profile.photos[0]) {
                                user.avatar = profile.photos[0].value;
                            }
                            await user.save();
                        }
                        return done(null, user);
                    }

                    // Create new user
                    user = await User.create({
                        email: email,
                        name: profile.displayName || profile.username,
                        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                        provider: 'github',
                        providerId: profile.id,
                        emailVerified: true
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        ));
    }
};

module.exports = configurePassport;

