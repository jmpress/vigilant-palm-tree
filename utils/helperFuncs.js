const bcrypt = require('bcrypt');

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

function sanitizeInput(stringle, numChar){
    stringle = stringle.replace(/[^a-z0-9áéíóúñü \.,_@-]/gim,"");
    stringle = stringle.trim();
            if(stringle.length > numChar){
                stringle = stringle.slice(0, numChar);
            }
    return stringle;
}

function randomString(len){
    let newRandom='';
    for(let i = 0; i < len; i++){
        newRandom += randomChar();
    }
    return newRandom;
}

function randomChar(){
    const randChar = String.fromCharCode(Math.floor(Math.random()*57)+64);
    return randChar;
}

function logSession(req, res){
//At this point in the program, what does the session look like?
    /*
    console.log('REQ');
    console.log(req.user);
    console.log(req.isAuthenticated)
    //console.log(req.cookies);
    //console.log(req.user);
    console.log('RES');
    console.log(res.session);
    */

}

module.exports = {makeSaltedHash, comparePasswords, sanitizeInput, logSession, randomString};