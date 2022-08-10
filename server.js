const express = require('express');
const app = express();
const txRouter = require('./routes/ticketRouter');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const _dirname = './'
module.exports = app;

// Set localHost port to listen at
const PORT = process.env.PORT || 3000;

// Add middleware for handling CORS requests from index.html
app.use(cors());

// Add middware for parsing request bodies here:
app.use(bodyParser.json());

// middleware for logging
app.use(morgan('dev'));

// set paths for static content
app.use(express.static(path.join(_dirname + 'public')));

// middleware for envelope handling
app.use('/', txRouter);

app.get('/', (req, res, next) => {
    res.sendFile(path.join(_dirname + 'public/index.html'));
});

// Add your code to start the server listening at PORT below:   
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});