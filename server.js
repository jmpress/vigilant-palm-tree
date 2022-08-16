//middleware via npm install
const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const store = new session.MemoryStore();
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

//middleware from ./routes folder
const { ensureAuthenticated } = require('./routes/helperFuncs');
const { txRouter } = require('./routes/ticketRouter');
const { userRouter } = require('./routes/userRouter');

const _dirname = './'
module.exports = app;

// Set localHost port to listen at
const PORT = process.env.PORT || 3000;

//Passport Configs
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/auth/github/callback'
  }, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Add middleware for handling CORS requests from index.html
app.use(cors());

// Add middware for parsing request bodies here:
app.use(express.json());

// middleware for logging
app.use(morgan('dev'));

// set up session
app.use(session({
  secret: 'exeggutor',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 300000000, secure: false },
  store
})
)
app.use(passport.initialize());
app.use(passport.session());

// set paths for static content
app.use(express.static(path.join(_dirname + 'public')));

// middleware for Ticket and User handling
app.use('/', txRouter);
app.use('/user', userRouter);

//oAuth routes for Github (should they be somewhere else)
app.get('/auth/github', 
  passport.authenticate('github', {scope: []})
);

app.get('/auth/github/callback', 
  passport.authenticate('github', {
    failureRedirect: '/index.html',
    successRedirect: '/inbox.html'
  })
);

app.get('/', (req, res, next) => {
    res.sendFile(path.join(_dirname + 'public/index.html'));
});

app.get('/logout', ensureAuthenticated, (req, res, next) => {
  req.session.destroy();
  res.status(200).send();
});

// Add your code to start the server listening at PORT below:   
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});