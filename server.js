//middleware via npm install
const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const http = require('http');
const helmet = require('helmet');
const passport = require('passport');
const store = new session.MemoryStore();
const LocalStrategy = require('passport-local').Strategy;
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

//database handlder
const db = require('./db/db')

//middleware and utils
const { comparePasswords, randomString} = require('./utils/helperFuncs');
const {txRouter} = require('./routes/ticketRouter');
const {authRouter} = require('./routes/userRouter');
const { query } = require('express');

const _dirname = './'
module.exports = app;

// set paths for static content
app.use(express.static(path.join(_dirname + 'public')));

// Set localHost port to listen at
const PORT = process.env.PORT || 3000;

// Add middware for parsing request bodies here:
app.use(express.json());
app.use(express.urlencoded({extended: true})); 
app.use(cookieParser());

// Add middleware for handling CORS requests and security
app.use(cors());
app.use(helmet());

// middleware for logging
app.use(morgan('dev'));

// set up session
app.use(session({
  name: 'vigilant-palm-tree',
  secret: process.env.SESSION_SECRET,
  state: randomString(8),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000*60*60, secure: false, sameSite: 'none' },
  secure: true,
  store
})
)

//Passport Configs
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.u_id);
});

passport.deserializeUser(async (id, done) => {

  const queryText = 'SELECT * FROM users WHERE u_id = $1';
  const queryParams = [id];
  const result = await db.query(queryText, queryParams);
  const loggedInUser = result.rows[0];
  if (!loggedInUser) {
      return done(new Error('failed to deserialize'));
  }
  done(null, loggedInUser);

});

passport.use(
  new LocalStrategy(async function (username, password, done) {
    const queryText = 'SELECT * FROM users WHERE u_email = $1';
    const queryParams = [username];
    const result = await db.query(queryText, queryParams);

    if(!result){return done(new Error('no response from db'));}
    const user = result.rows[0];
    console.log(user);
      if (!user) {
          console.log('Incorrect username.');
          return done(null, false, { message: 'Incorrect username.' });
      } else if (!(await comparePasswords(password, user.salted_hashed_pass))) {
          console.log('Incorrect password');
          return done(null, false, { message: 'Incorrect password.' });
      } else {
          console.log('ok');
          done(null, user);
      }
    })
  ); 


app.use('/tx', ensureAuthenticated, txRouter);
app.use('/auth', authRouter);

app.get('/', (req, res, next) => {
    res.sendFile(path.join(_dirname + 'public/index.html'));
});

// Add your code to start the server listening at PORT below:   
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

function ensureAuthenticated(req, res, next) {
  if(req.isAuthenticated()){ return next() };
  res.redirect('/');
}