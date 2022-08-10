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

    console.log(req.body);
    //What's the actual logic to validate a ticket object

    //Assume true:
        req.isValid = true;
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
    console.log(ticket_subject);
        ticket_subject = sanitizeInput(ticket_subject, 50);
        ticket_description = sanitizeInput(ticket_description, 140);
        ticket_from = sanitizeInput(ticket_from, 40);
        
    //validate Date format (open_date, close_date)
        const validatePattern = /^(\d{4})(\/|-)(\d{1,2})(\/|-)(\d{1,2})$/;
        const dateValA = open_date.match(validatePattern);
        let dateValB = true;
        if(close_date != null){
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
    console.log('inside sanitize:'+stringle);
    stringle = stringle.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    stringle = stringle.trim();
            if(stringle.length > numChar){
                ticket_subject = ticket_subject.slice(0, numChar);
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
    console.log('inside POST');
    if(!req.isValid){
        res.status(400).send(req.validReason);
    } else {
        const {ticket_id, open_date, close_date, ticket_priority, ticket_status, ticket_subject, ticket_description, ticket_from, opener_id, closer_id} = req.body;
        const queryText = 'INSERT INTO tickets (open_date, close_date, ticket_priority, ticket_status, ticket_subject, ticket_description, ticket_from, opener_id, closer_id) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, NULL);';
        console.log(req.body);
        console.log(queryText);
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

        console.log(req.body);
        tickets.push(req.body);
        res.status(200).send(tickets);
    }
});

/*  Last Priority
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


//PUT route to update values of a ticket
txRouter.put('/:id', isValidTicket, async (req, res, next) => {
    if(!req.IDMatch){ //valid ticket but ID doesn't match
        req.isValid = false; 
        req.validReason = 'ID does not exist yet. Make a new ticket with this ID before Updating it.'
    }
    if(!req.isValid){
        res.status(400).send(req.validReason);
    } else {    
        const newT = req.body;
        
        const newID = newT.ticket_id;
        const newTarget = newT.wd_envelope_id;
        const newDate = newT.ticket_date;
        const newPayee = newT.payment_recipient;
        const newAmount = newT.payment_amount;

        const checkOld = 'SELECT * FROM tickets WHERE ticket_id = $1';
        const { rows } = await db.query(checkOld, [newID]);
        const oldT = rows[0]; //This object is the original version of the ticket in question from the database, for later use.
        

        //Query to update the ticket in question
        const queryText = 'UPDATE tickets SET wd_envelope_id = $2, ticket_date = $3, payment_recipient = $4, payment_amount = $5 WHERE ticket_id = $1;'
        await db.query(queryText, [newID, newTarget, newDate, newPayee, newAmount]);

        //Handling balance changes between envelopes
        if(oldT.wd_envelope_id != newTarget){
        //different envelopes, two balance changes. 
        //This naturally handles cases where the amount of the ticket is also being updated as well.
            //First change old envelope back
            const updateOldQuery = 'UPDATE envelopes SET current_value = current_value + $1 WHERE envelope_id = $2';
            await db.query(updateOldQuery, [oldT.payment_amount, oldT.wd_envelope_id]);
            //Second change new envelope to compensate
            const updateNewQuery = 'UPDATE envelopes SET current_value = current_value - $1 WHERE envelope_id = $2';
            await db.query(updateNewQuery, [newAmount, newTarget]);

        } else if(oldT.payment_amount != newAmount){
        //Case when envelope is the same, but amount changes.
            //calculate difference
            const diff = (oldT.payment_amount - newAmount);
            //Query database and current_value = current_value - diff; or something to that effect
            const amtQuery = 'UPDATE envelopes SET current_value = current_value + $1 WHERE envelope_id = $2';
            await db.query(amtQuery, [diff, newTarget]);
        }

        res.status(200).send();
    }
});

*/

txRouter.use((err, req, res, next) => {
    console.log(err.message);
    res.status(err.status).send(err.message);
})

module.exports = txRouter;
