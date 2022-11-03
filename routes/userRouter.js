const express = require('express');
const db = require('../db/db');
const Router = require('express-promise-router');
const authRouter = new Router();
const { makeSaltedHash, comparePasswords, sanitizeInput } = require('../utils/helperFuncs');
const passport = require('passport');

authRouter.route('/login')
    .get((req, res, next) => {
        res.redirect('/');
    })
    .post(passport.authenticate('local', {  
        successRedirect: '/inbox.html',
        failureRedirect: '/' 
    }));


authRouter.post('/logout', (req, res, next) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

//next step: get this working!
authRouter.route('/register')
    .get((req, res, next) => {
        res.redirect('/newUser.html');
    })
    .post(async (req, res, next) => {
    const { u_email, plain_pass } = req.body;
    //Salt and hash the pass
    const saltedPass = await makeSaltedHash(plain_pass);
    //save new user to database.
    const queryParams = [
        u_email,
        saltedPass,
        0
    ]
    const queryText = 'INSERT INTO users (u_email, salted_hashed_pass, num_tix_closed) VALUES ($1, $2, $3);'
    const regUser = await db.query(queryText, queryParams);
    
    res.status(200).send();
});

/*
authRouter.get('/profile', (res, req, next) => {
    res.render('profile', {user: req.user});
})


function validateUser(req, res, next){
    let { firstName, lastName, userEmail, userPassA, userPassB } = req.body;
    //check passA and passB are equal 
    if(userPassA !== userPassB){res.redirect('/auth/register');}
    firstName = sanitizeInput(firstName, 255);
    lastName = sanitizeInput(lastName, 255);
    userEmail = sanitizeInput(userEmail, 255);
    const validUser = {
        firstName,
        lastName,
        userEmail,
        userPassA,
        userPassB,
    };
    req.body = validUser;
    next();
}
*/
module.exports = {authRouter};