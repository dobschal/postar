const express = require('express');
const router = express.Router();
var db = require("../service/db");

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


module.exports = router;
