# Viglant-Palm-Tree
## A simple ticket-tracking system, extensible for several purposes.
#### By Jeffrey Press

## Description
This is an exercise in writing a RESTful Express API that handles database operations for a PostgreSQL server via HTTP requests from a simple HTML/CSS/JS front-end, and incorporating authorization and authentication methods (sessions, passport.js local strategy).<br>

## Specs
+ Register and Log in users via local user database.
+ Display a table of all tickets.
    + Table is sortable both ascending and descending by clicking most column headers. 
        + since ID is an auto-incremented key from the database, it can act as a rough "age" value.
    + Closed tickets are hidden by default. A checkbox below allows viewing closed tickets as well as open tickets. 
    + Table rows are clickable and navigate to a page with full details of the ticket.
+ Open a new ticket.
    + Assign a priority to the new ticket via dropdown menu.
    + Enter Subject, Details, and "Regarding" as desired.
        + "Regarding" field is intended to be a non-specific field holding something like project name, customer account, or whathaveyou.
        + All tickets are created with an "Open" status.
        + Ticket ID is automatically generated by the database.
+ Display a single ticket detail page.
    + Detail page enables changing a ticket's priority and/or status via dropdown menu.
    + Ticket Subject, original details, and "regarding" field are not editable.
    + New details may be added and are appended to the original details along with a timestamp.
+ Deleting tickets is currently not implemented, and unlikely to be, as the intention is to keep these records so they're referrable in the future.


### Installation and Set-up
+ This app is hosted at <https://vigilant-palm-tree.herokuapp.com/>.
    + This deployment of the app is currently being used to track goals for its own further development.

OR

+ Fork this repository
+ Install Node and PostgreSQL locally.
+ Navigate to folder and run `npm install`
+ Create a .env file in the root directory with your database authentication information. Use the following format:
    ```
    PMAPIUSER = "apiuser"
    PMHOST = "localhost"
    PMDATABASE = "database_name"
    PMAPIUSERPW = "p4ssw0rd"
    PMDBPORT = "5432"
    ```
+ use the `init.sql` file to create the appropriate tables locally.
+ run `npm start`
+ navigate to <http://localhost:3000> to begin using the program.

## Known Bugs
+ This has only been tested in Firefox; compatibility with other browsers is not assured.

## Support and contact details
Please contact j.michael.press@gmail.com with questions, comments, or concerns. You are also welcome to submit a pull request.

## Technologies Used
   + Javascript
   + Node.js
   + Express
   + PostgreSQL
   + Passport.js

### License
This software is released under the GNU general public license.

Copyright (c) 2022 Jeffrey Michael Press
