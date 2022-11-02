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

authRouter.route('/register')
    .get((req, res, next) => {
        res.render('newUser');
    })
    .post(validateUser, async (req, res, next) => {
    const { firstName, lastName, userEmail, userPassA, userPassB } = req.body;
    //check passA and passB are equal 
    if(userPassA !== userPassB){res.redirect('/auth/register');}
    //Salt and hash the pass
    const saltedPass = await makeSaltedHash(userPassA);
    //save new user to database.
    const newUser = {
        firstName, 
        lastName,
        email: userEmail,
        token: '',
        password: saltedPass
    }
    //const regUser = await db.User.create(newUser);
    console.log("auto-generated ID:", regUser.id);
    //redirect to auth/login
    //res.redirect('/image/all');
});

/*
authRouter.get('/profile', (res, req, next) => {
    res.render('profile', {user: req.user});
})
*/

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

module.exports = {authRouter};