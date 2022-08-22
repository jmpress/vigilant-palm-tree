//This file needs to be refactored to only include the routing handlers.

const express = require('express');
const db = require('../db/db');
const Router = require('express-promise-router');
const bcrypt = require('bcrypt');
const passport = require(passport);
const userRouter = new Router();
const { sanitizeInput, logSession} = require('./helperFuncs');


const users = [];

/*
users database schema:
    u_id,
    u_email,
    salted_hashed_pass,
    num_tix_closed

authentication_profiles database schema:
    provider_id
    provider_name
    u_id (foreign key to users table)
    auth_token

logged in user Object (stored at users[0])
{
    u_id,
    u_email,
    provider_id,
    provider_name,
    auth_token,
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

    //need validations for authentication_profile fields as well

    req.body.u_email = u_email;
    next();
}

function isValidEmail(questionableEmail){
    re = /\S+@\S+\.\S+/;
    return re.test(questionableEmail);
}

const ensureAuthenticated = (req, res, next) => {
    if(req.isAuthenticated){
        console.log('Still Authed');
        return next();
    } else {
        console.log('Authentication has dropped');
        res.redirect('/index.html');
    }
  };

userRouter.post('/new', isValidUser, async (req, res, next) => {
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
    res.status(500).send(err.message);
})

module.exports = {users, userRouter};