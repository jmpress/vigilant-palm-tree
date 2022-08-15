const express = require('express');
const db = require('../db/db');
const Router = require('express-promise-router');
const bcrypt = require('bcrypt');
const userRouter = new Router();
const { sanitizeInput, ensureAuthenticated } = require('./helperFuncs');

const users = [];

/*
User Object definition:
{
    u_id,
    u_email,
    salted_hashed_pass,
    num_tix_closed
}
*/

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

    req.body.u_email = u_email;
    next();
}

function isValidEmail(questionableEmail){
    re = /\S+@\S+\.\S+/;
    return re.test(questionableEmail);
}

userRouter.use('/login', async (req, res, next) => {

})

userRouter.post('/new', isValidUser, async (req, res, next) => {
    if(!req.isValid){
        res.status(400).send(req.validReason);
    } else {
        const {u_id, u_email, plain_pass, num_tix_closed} = req.body;
        
        //hash and salt the pass here
        const salted_hashed_pass = await makeSaltedHash(plain_pass);
        
        const queryText = 'INSERT INTO users (u_email, salted_hashed_pass, num_tix_closed) VALUES ($1, $2, 0);';
        const queryParams = [
            u_email,
            salted_hashed_pass
        ]
        
        newUser = {
            u_id,
            u_email,
            salted_hashed_pass,
            num_tix_closed
        }
        console.log(newUser);
        await db.query(queryText, queryParams);
        
        res.status(200).send(newUser);
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

async function comparePasswords(password, hash){
    try{
        const matchFound = await bcrypt.compare(password, hash);
        return matchFound;
    } catch(err) {
        console.log(err);
    }
    return false;
}

userRouter.use((err, req, res, next) => {
    console.log(err.message);
    res.status(err.status).send(err.message);
})

module.exports = {userRouter};