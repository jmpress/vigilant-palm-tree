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
const { sanitizeInput, logSession, randomString} = require('./utils/helperFuncs');
const {txRouter} = require('./routes/ticketRouter');

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
  secure: true,  //when in production, make it true.
  store
})
)

//Passport Configs

app.use('/tx', txRouter);

app.get('/', (req, res, next) => {
    res.sendFile(path.join(_dirname + 'public/inbox.html'));
});

// Add your code to start the server listening at PORT below:   
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
