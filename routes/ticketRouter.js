const express = require('express');
const db = require('../db/db');
const Router = require('express-promise-router');
const txRouter = new Router();

//Internal Data Structure for holding Ticket objects
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

function sanitizeInput(stringle, numChar){
    stringle = stringle.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    stringle = stringle.trim();
            if(stringle.length > numChar){
                stringle = stringle.slice(0, numChar);
            }
    return stringle;
}

txRouter.get('/inbox', async (req, res, next) => {
    const queryText = 'SELECT * FROM tickets;';
    tickets.length=0;
    const {rows} = await db.query(queryText);
    for(let i = 0; i < rows.length; i++){
        tickets.push(rows[i]);
    }
    res.status(200).send(tickets);
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
            opener_id, 
        ]
        await db.query(queryText, queryParams);

        tickets.push(req.body);
        res.status(200).send(tickets);
    }
});

  
//GET route to get single ticket into
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

        //tickets.push(req.body);
        res.status(200).send();
    }
});


/*Last Priority
txRouter.delete('/:id', async (req, res, next) => {
    const target = req.params.id;
    let affEnv; 
    let changeAmount;

    //validate that target is a ticket that exists
    req.isValid = tickets.some(ticket => {
        if(ticket.ticket_id == target){
            affEnv = ticket.wd_envelope_id;
            changeAmount = ticket.payment_amount;
            return true;
        } else {return false;}
    });
    
    if(!req.isValid){
        res.status(404).send(req.validReason);
    } else {
        //if it's a valid ticket that exists, then
        //Deletion Query
        const deleteQuery = 'DELETE FROM tickets WHERE ticket_id = $1;';
        await db.query(deleteQuery, [target]);

        //Now change the balance of the envelope back
        const updateQuery = 'UPDATE envelopes SET current_value = current_value + $1 WHERE envelope_id = $2';
        await db.query(updateQuery, [changeAmount, affEnv]);
            
        res.status(200).send();
    }
});
*/

txRouter.use((err, req, res, next) => {
    console.log(err.message);
    res.status(err.status).send(err.message);
})

module.exports = txRouter;
