const express = require('express');
const db = require('../db/db');
const Router = require('express-promise-router');
const txRouter = new Router();
//const passport = require('passport');
const { sanitizeInput, logSession } = require('../utils/helperFuncs');

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

    //Validate Priority and Status (1-4 each)
        if(ticket_priority < 1 || ticket_priority > 4){
            req.isValid = false;
            req.validReason = 'Priority must be between 1 and 4';
        }
        if(ticket_status < 1 || ticket_status > 4){
            req.isValid = false;
            req.validReason = 'Status must be between 1 and 4';
        }

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

txRouter.get('/inbox', async (req, res, next) => {
    const queryText = 'SELECT * FROM tickets;';
    tickets.length=0;
    const {rows} = await db.query(queryText);
    for(let i = 0; i < rows.length; i++){
        tickets.push(rows[i]);
    }
    res.status(200).send({tickets: tickets, user: req.user});
});

//Create a new ticket from user input
txRouter.post('/newTicket', isValidTicket, async (req, res, next) => {
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
            req.user.u_id, 
        ]
        await db.query(queryText, queryParams);

        tickets.push(req.body);
        res.status(200).send(tickets);
    }
});

  
//GET route to get single ticket info
//works
txRouter.get('/updateTicket/:id', async (req, res, next) => {
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
txRouter.put('/updateTicket/:id', isValidTicket, async (req, res, next) => {
    //Updating a ticket should:
    if(!req.isValid){
        res.status(400).send(req.validReason);
    } else {
        let {ticket_id, close_date, ticket_priority, ticket_status, ticket_description, closer_id} = req.body;

        const queryText = `UPDATE tickets SET close_date = $2, ticket_priority = $3, ticket_status = $4, ticket_description = $5, closer_id = $6 WHERE ticket_id = $1;`;
        
        if(closer_id!=null){closer_id = req.user.u_id}

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


txRouter.use((err, req, res, next) => {
    console.log(err.message);
    res.status(err.status).send(err.message);
})



module.exports = {txRouter};
