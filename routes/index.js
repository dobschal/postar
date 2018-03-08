const express = require('express');
const router = express.Router();
const db = require("../service/db");
const hash = require("../service/hash/sha512");
const config = require("../config");

router.post('/api/post', function(req, res, next) {    
    const { content, x, y } = req.body;

    db.insert("post", { content: content, x: x, y: y, timestamp: Date.now() }, error => {
        if( error)
        {
            res.status(500).send({ error: error });  
        }
        res.status(200).send({"success": "Saved post."});  
    });    
});

router.get('/api/post', function(req, res, next) {
  db.get("post", {}, (error, data) => {
      if( error)
      {
          res.status(500).send({ error: error });  
      }
      if( req.query.timestamp )
      {
        let timestamp = parseInt( req.query.timestamp );
        data = data.filter( item => {
            return item.timestamp > timestamp;
        });
      }
      res.status(200).send( data );  
  });    
});

router.post('/api/user/add', function(req, res, next) {    
    const { username, password } = req.body;

    db.get("user", { username: username }, (error, data) => {
        if( error)
        {
            return res.status(500).send({ error: error });  
        }
        if( data.length > 0 )
        {
            return res.status( 409 ).send({error: "user already exists."});
        }
        db.insert("user", { username: username, password: hash( password ), timestamp: Date.now() }, error => {
            if( error)
            {
                res.status(500).send({ error: error });  
            }
            res.status(200).send({"success": "Added user."});  
        });    
    });
});

router.post('/api/user/login', function(req, res, next) {    
    const { username, password } = req.body;

    db.get("user", { username: username }, (error, data) => {
        if( error)
        {
            return res.status(500).send({ error: error });  
        }
        if( data.length !== 1 )
        {
            return res.status( 409 ).send({error: "User dos not exist."});
        }
        let user = data[ 0 ];
        if( hash( password ) !== user.password )
        {
            return res.status( 401 ).send({error: "Wrong password."});
        }        
        
        let     tokenContent = user;
        delete  tokenContent.password;
                tokenContent.expiresAt = Date.now() + config.expiration;

        let tokenAsString = JSON.stringify( tokenContent );        
        let tokenSignature = hash( tokenAsString + config.secret );

        let tokenBodyAsBase64String = Buffer.from( tokenAsString ).toString('base64');
        let tokenSignatureAsBase64String = Buffer.from( tokenSignature ).toString('base64');

        res.status( 200 ).send( tokenBodyAsBase64String + "." + tokenSignatureAsBase64String );
    });
});


module.exports = router;
