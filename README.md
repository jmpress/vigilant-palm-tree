# Viglant-Palm-Tree
## A simple ticket-tracking system, extensible for several purposes.

This is an exercise in writing a RESTful Express API that handles database operations for a PostgreSQL server via  HTTP requests from a simple HTML/CSS/JS front-end, and incorporating authorization and authentication methods (sessions, passport.js, local and oAuth2.0 strategies)

### Installation and Set-up
Please Note: Instructions for installing Node, Node modules, Express, or PostreSQL are beyond the scope of this document.

The server uses some pre-defined middleware components for request parsing (body-parser), logging (morgan), and some other functionality which will need to be installed locally if they are not already present on your system.

Prior to running this locally, you will need to create a .env file in the root directory with your database authentication information. Use the following format, but with your own credentials and database name:
```
PMAPIUSER = "apiuser"
PMHOST = "localhost"
PMDATABASE = "ticket_tracker"
PMAPIUSERPW = "p4ssw0rd"
PMDBPORT = "5432"
```
Once the .env file is created, run  `$node server.js`, and navigate to localhost:3000 to begin using the program.

Once I have a reasonably full-featured release I will be deploying this to Heroku, at which point it should be accessible at https://vigilant-palm-tree.herokuapp.com.

### Description


<hr>

### Intended user flow:

#### Creating a User Account and logging in:
+ blah

#### Navigating the Inbox:
+ blah

#### Creating a new Ticket:
+ blah

#### Updating a Ticket:
+ blah 

#### Closing a Ticket:
+ blah
