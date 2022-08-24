function sanitizeInput(stringle, numChar){
    stringle = stringle.replace(/[^a-z0-9áéíóúñü \.,_@-]/gim,"");
    stringle = stringle.trim();
            if(stringle.length > numChar){
                stringle = stringle.slice(0, numChar);
            }
    return stringle;
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

module.exports = {sanitizeInput, logSession};