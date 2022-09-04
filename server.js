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
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');


//database handlder
const db = require('./db/db')

//middleware from ./routes folder
const { sanitizeInput, logSession} = require('./routes/helperFuncs');
const {txRouter} = require('./routes/ticketRouter');
const {userRouter} = require('./routes/userRouter');

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
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000*60*60, secure: false, sameSite: 'none' },
  //secure: true,  when in production, make it true.
  store
})
)
app.use(passport.initialize());
app.use(passport.session());  //aka app.use(passport.authenticate('session'));


//Passport Configs
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK,
  }, async (accessToken, refreshToken, profile, done) => {  //this is the verify callback
        
    return done(null, profile); //return?
  }
));

app.use('/tx', ensureAuthenticated, txRouter);
app.use('/user', userRouter);


//This needs to be moved into userModel as a method
async function findOrCreateUser(profile, accessToken){
// this fucntion should: check if the profile matches one on file. If not, create a new one, if so, log in as that user.
  let loggedInUser = {};
  const newGitHubUser = {
    u_email: profile._json.email,
    provider_id: profile._json.id,
    provider_name: profile.provider,
    auth_token: accessToken
  }

  //Look at whether there is already a github authentication profile with the right ID
  const userSearch = 'SELECT * FROM authentication_profiles WHERE provider_id = $1 AND provider_name = $2;';
  const searchParams = [
    newGitHubUser.provider_id,
    newGitHubUser.provider_name
  ]

  let { rows } = await db.query(userSearch, searchParams);
  if(rows.length === 0){  //i.e. if there were no returned results
  //create new user in database from newGitHubUser
    newUser = {
      u_id: 0,
      u_email: newGitHubUser.u_email,
      provider_id: newGitHubUser.provider_id,
      provider_name: newGitHubUser.provider_name,
      auth_token: newGitHubUser.auth_token,
      salted_hashed_pass: '',
      num_tix_closed: 0
    }
    //console.log(newUser);
    
    const data = JSON.stringify(newUser);
    
    const options = {
      host: process.env.HOST,
      port: PORT,
      path: '/user/new',
      headers:{
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      method: 'POST'
    };
    //console.log(options);

    const newReq = http.request(options, async function(res) {  //This shouldn't be here and its functionality needs to be done differently. The whole parent function should be in the ObjectModel file as an object method.
      //console.log('STATUS: ' + res.statusCode);
      //console.log('HEADERS: ' + JSON.stringify(res.headers));
      //res.setEncoding('application/json');
      res.on('data', function (chunk) {
        //console.log('BODY: ' + chunk);
        loggedInUser = chunk;
      });
      
    });
    newReq.write(data);

    //req.end();
    return loggedInUser;
    
  } else {                //else there were results, i.e. someone with that provider ID is already registered.
    //use rows[0].u_id to run a new query on users table
    const findUserQuery = 'SELECT * FROM users WHERE u_id = $1';
    const findUserParams = [rows[0].u_id];
    const foundUser = await db.query(findUserQuery, findUserParams);
    
    //make a new logged in user object from those queries
    const {u_id, u_email, salted_hashed_pass, num_tix_closed } = foundUser.rows[0];
    const {provider_id, provider_name, auth_token} = rows[0];
    loggedInUser = {
      u_id,
      u_email,
      provider_id,
      provider_name,
      auth_token,
      salted_hashed_pass,
      num_tix_closed
    }
    return loggedInUser;
  } 
  
}

passport.serializeUser((user, done) => {
  //console.log('inside serialize')
  //console.log(user);
  done(null, user);
});

passport.deserializeUser(async (user, done) => {
  //console.log('inside deserialize');
  //console.log(user);
  
  /*
  //post-refactor, this will be a call to a function on the User class object.
  //query database for user with id of 'user'
  const findUserQuery = 'SELECT * FROM users INNER JOIN authentication_profiles ON users.u_id = authentication_profiles.u_id WHERE users.u_id = $1;';
  const findUserParams = [user];
  const { rows } = await db.query(findUserQuery, findUserParams);
  //console.log(rows);
  //build the user object
  const {u_id, u_email, salted_hashed_pass, num_tix_closed, provider_id, provider_name, auth_token} = rows[0];
  loggedInUser = {
    u_id,
    u_email,
    provider_id,
    provider_name,
    auth_token,
    salted_hashed_pass,
    num_tix_closed
  }
  console.log(loggedInUser.u_id);
  */
  done(null, user);
});

//oAuth routes for Github (should they be somewhere else? )
app.get('/auth/github', 
  passport.authenticate('github', {scope: ['read:user, user:email']})
);

app.get('/auth/github/callback', 
  passport.authenticate('github', {
    failureRedirect: '/index.html',
    successRedirect: '/login'
  })
);


app.get('/', (req, res, next) => {
    res.sendFile(path.join(_dirname + 'public/index.html'));
});

app.get('/login', (req, res, next) => {
  
  res.redirect('/inbox.html')
});

app.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
  res.redirect('/');
  });
});

// Add your code to start the server listening at PORT below:   
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

function ensureAuthenticated(req, res, next) {
  logSession(req, res);
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
}