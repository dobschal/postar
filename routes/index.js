const express = require('express');
const router = express.Router();
const db = require("../service/db");
const hash = require("../service/hash/sha512");
const config = require("../config");
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectID;

router.post('/api/post', function(req, res, next) {    
    const { content, x, y, timestamp } = req.body;
    const post = { content: content, x: x, y: y, timestamp: timestamp, _id: new ObjectId() };

    db.insert("post", post, error => {
        if( error)
        {
            res.status(500).send({ error: error });  
        }
        console.log("Added new post...", post);
        res.status(200).send({ success: "Saved post.", post: post });  
    });    
});

router.get('/api/post', function(req, res, next) {
    let index = 0;
    getItems( req, res, index, items => {
        res.status(200).send( items );
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

function getItems( req, res, index, callback )
{
    index++;
    if( index > 2 )
    {
        return callback( [] );
    }
    db.get("post", {}, (error, data) => {
        if( error)
        {
            return res.status(500).send({ error: error });  
        }      
        if( req.query.timestamp )
        {
            let timestamp = parseInt( req.query.timestamp );
            data = data.filter( item => {
                return item.timestamp > timestamp;
            });
        }
        if( req.query.starttime )
        {
            let timestamp = parseInt( req.query.starttime );
            data = data.filter( item => {
                return item.timestamp > timestamp;
            });
        }
        if( data.length === 0 )
        {
            return setTimeout(() => {
                getItems( req, res, index, callback );
            }, 500 );
        }        
        callback( data );
    });    
}


module.exports = router;
