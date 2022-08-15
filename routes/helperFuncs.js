function sanitizeInput(stringle, numChar){
    stringle = stringle.replace(/[^a-z0-9áéíóúñü \.,_@-]/gim,"");
    stringle = stringle.trim();
            if(stringle.length > numChar){
                stringle = stringle.slice(0, numChar);
            }
    return stringle;
}

const ensureAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()){
      return next();
    } else {
      //res.redirect('/login');
    }
  };

module.exports = {sanitizeInput, ensureAuthenticated};