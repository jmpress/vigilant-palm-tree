//middleware via npm install
const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const http = require('http');
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

// Add middleware for handling CORS requests from index.html
app.use(cors());

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
    callbackURL: '/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {  //this is the verify callback
        
    return done(null, profile); //return?
  }
));

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
  passport.authenticate('github', {scope: ['user']})
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

//Internal Data Structure for holding Objects
const tickets = [];

/* Ticket object definition:
{
    ticket_id,
	open_date,
	close_date,
	ticket_priority,
	ticket_status,
	ticket_subject,
	ticket_description,
    ticket_from,
	opener_id,
	closer_id
}
    ticket_id, open_date, close_date, ticket_priority, ticket_status, ticket_subject, ticket_description, ticket_from, opener_id, closer_id
*/

//Checks the validity of a ticket
async function isValidTicket(req, res, next){
        let { ticket_id, open_date, close_date, ticket_priority, ticket_status, ticket_subject, ticket_description, ticket_from, opener_id, closer_id } = req.body;

    //What's the actual logic to validate a ticket object

    //Assume true:
        req.isValid = true;
        req.validReason = 'all ok';
        req.IDMatch = false;

    //ticket_id is auto incremented by the database itself, therefore...
    //ID for a new item is going to come in with ...any kind of default value that does validate, but won't be passed into the INSERT query. If that is causing problems for some reason, perhaps define new tickets as having a ticket_id = -1 ?

    //Validate ticket_id as a number > 0
        ticket_id = parseInt(ticket_id, 10);
        if(isNaN(ticket_id) || ticket_id < 0){
            req.isValid = false;
            req.validReason = 'ID must be a non-negative integer.'
            next();
        }

    //Check and flag if the ticket ID already exists or not.
        for(let i = 0; i < tickets.length; i++){
            if(tickets[i].ticket_id === ticket_id){
                req.IDMatch = true;
            }
        }

    //Validate Priority and Status (1-4 each) (these may become dropdown values from input boxes)
        if(ticket_priority < 1 || ticket_priority > 4){
            req.isValid = false;
            req.validReason = 'Priority must be between 1 and 4';
        }
        if(ticket_status < 1 || ticket_status > 4){
            req.isValid = false;
            req.validReason = 'Status must be between 1 and 4';
        }

    /*/make sure String values exist are clean (ticket_subject, ticket_description)
        if(ticket_subject === undefined || ticket_subject === undefined || ticket_from === undefined){
            req.isValid = false;
            req.validReason = 'Please include all required fields'
            next()
        }*/

    //Sanitize string values and truncate if necessary
        ticket_subject = sanitizeInput(ticket_subject, 50);
        ticket_description = sanitizeInput(ticket_description, 500);
        ticket_from = sanitizeInput(ticket_from, 40);
        
    //validate Date format (open_date, close_date)
        open_date = sanitizeInput(open_date, 10);
        const validatePattern = /^(\d{4})(\/|-)(\d{1,2})(\/|-)(\d{1,2})$/;
        const dateValA = open_date.match(validatePattern);
        let dateValB = true;
        if(close_date != null){
            close_date = sanitizeInput(close_date, 10);
            dateValB = close_date.match(validatePattern);
        }
        if(!dateValA || !dateValB){
            req.isValid = false;
            req.validReason = 'Invalid date format';
            next();
        }

        const fixedNewTicket = {
            ticket_id,
	        open_date,
	        close_date,
	        ticket_priority,
	        ticket_status,
	        ticket_subject,
	        ticket_description,
            ticket_from,
	        opener_id,
	        closer_id
        }
        req.body = fixedNewTicket;
        next();
}

function ensureAuthenticated(req, res, next) {
    logSession(req, res);
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/');
    }
  }
  
app.get('/inbox', ensureAuthenticated, async (req, res, next) => {
    
    console.log('inside Inbox');
    logSession(req, res);
    const queryText = 'SELECT * FROM tickets;';
    tickets.length=0;
    const {rows} = await db.query(queryText);
    for(let i = 0; i < rows.length; i++){
        tickets.push(rows[i]);
    }
    res.status(200).send(tickets);
});

//Create a new ticket from user input
app.post('/newTicket',ensureAuthenticated, isValidTicket, async (req, res, next) => {
    console.log('inside newTicket');
    logSession(req, res);
    if(!req.isValid){
        res.status(400).send(req.validReason);
    } else {
        tickets.length = 0;
        const {ticket_id, open_date, close_date, ticket_priority, ticket_status, ticket_subject, ticket_description, ticket_from, opener_id, closer_id} = req.body;
        const queryText = 'INSERT INTO tickets (open_date, close_date, ticket_priority, ticket_status, ticket_subject, ticket_description, ticket_from, opener_id, closer_id) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, NULL);';
        const queryParams = [
            open_date, 
            ticket_priority, 
            ticket_status, 
            ticket_subject, 
            ticket_description, 
            ticket_from, 
            opener_id, 
        ]
        await db.query(queryText, queryParams);

        tickets.push(req.body);
        res.status(200).send(tickets);
    }
});

  
//GET route to get single ticket info
//works
app.get('/updateTicket/:id', ensureAuthenticated, async (req, res, next) => {
    console.log('inside GET UpdateTicket');
    logSession(req, res);
    const queryString = 'SELECT * FROM tickets WHERE ticket_id = $1'
    const queryParams = [req.params['id']];     //the :id: passed in
    const {rows} = await db.query(queryString, queryParams);
    const {ticket_id, open_date, close_date, ticket_priority, ticket_status, ticket_subject, ticket_description, ticket_from, opener_id, closer_id} = rows[0];

    const getOne = {
            ticket_id,
	        open_date,
	        close_date,
	        ticket_priority,
	        ticket_status,
	        ticket_subject,
	        ticket_description,
            ticket_from,
	        opener_id,
	        closer_id
    }
    res.status(200).send(getOne)
});

//PUT route to update values of a ticket
//works, and increments user stat for closing a ticket when appropriate
app.put('/updateTicket/:id', ensureAuthenticated, isValidTicket, async (req, res, next) => {
    //Updating a ticket should:
    console.log('inside PUT updateticket');
    logSession(req, res);
    if(!req.isValid){
        res.status(400).send(req.validReason);
    } else {
        let {ticket_id, close_date, ticket_priority, ticket_status, ticket_description, closer_id} = req.body;

        const queryText = `UPDATE tickets SET close_date = $2, ticket_priority = $3, ticket_status = $4, ticket_description = $5, closer_id = $6 WHERE ticket_id = $1;`;
        
        const queryParams = [
            ticket_id,
            close_date, 
            ticket_priority, 
            ticket_status, 
            ticket_description, 
            closer_id
        ]
        await db.query(queryText, queryParams);

        if(close_date != null && closer_id != null){
            //Ticket just closed: update the num_tix_closed value of the user
            const queryText2 = 'UPDATE users SET num_tix_closed = num_tix_closed +1 WHERE u_id = $1';
            await db.query(queryText2, [closer_id]);
        }

        res.status(200).send();
    }
});


const users = [];

function isValidUser(req, res, next){
    //what does a valid User object look like?
    let {u_id, u_email, plain_pass, num_tix_closed} = req.body
    //So far, u_id and num_tix_closed will be automatically generated and should be valid.
    req.isValid = true;
    req.validReason = '';

    //sanitize email address
    u_email = sanitizeInput(u_email, 40)

    //validate it as a well-formatted email address
    if(!isValidEmail(u_email)){
        req.isValid = false;
        req.validReason = 'bad email address';
        next();
    }

    //plain_pass can be anything as a password. We'll salt and hash it later.

    //need validations for authentication_profile fields as well

    req.body.u_email = u_email;
    next();
}

function isValidEmail(questionableEmail){
    re = /\S+@\S+\.\S+/;
    return re.test(questionableEmail);
}

app.post('/user/new', isValidUser, async (req, res, next) => {
    if(!req.isValid){
        res.status(400).send(req.validReason);
    } else {
        const newUser = req.body

        let {u_id, u_email, provider_id, provider_name, auth_token, plain_pass, num_tix_closed} = req.body;
        
        //hash and salt the pass here
        let salted_hashed_pass = '';
        if(plain_pass){
            salted_hashed_pass = await makeSaltedHash(plain_pass);
        }
        
        //First need to insert into the users table to generate the primary key.
        let queryText = 'INSERT INTO users (u_email, salted_hashed_pass, num_tix_closed) VALUES ($1, $2, 0);';
        let queryParams = [u_email, salted_hashed_pass]
        let result = await db.query(queryText, queryParams);
        
        const findIdQuery = 'SELECT u_id FROM users WHERE u_email = $1';
        const findIdParams = [u_email];
        let crows = await db.query(findIdQuery, findIdParams);
        //console.log(crows);
        u_id = crows.rows[0].u_id;

        newUser = {
            u_id,
            u_email,
            salted_hashed_pass,
            num_tix_closed
        }

        newAuthProfile = {  //can't add this until the user generated an indexed u_id
            provider_id,
            provider_name,
            u_id,
            auth_token,
        }

        const insertAuthProvQuery = 'INSERT INTO authentication_profiles (provider_id, provider_name, u_id, auth_token) VALUES ($1, $2, $3, $4);';
        const insertAuthProvParams = [provider_id, provider_name, u_id, auth_token];

        const iapResult = await db.query(insertAuthProvQuery, insertAuthProvParams)

        const loggedInUser = {
            u_id,
            u_email,
            provider_id,
            provider_name,
            auth_token,
            salted_hashed_pass,
            num_tix_closed
        }
        users.length = 0;
        users.push(loggedInUser);
        res.status(200).send(users);
    }
});

async function makeSaltedHash(plain_pass){
    const saltRounds = 10;
    try{
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(plain_pass, salt);
        return hash;
    } catch(err){
        console.log(err);
    }
}

