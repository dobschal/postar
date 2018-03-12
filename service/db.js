var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectID;
var config = require("../config");

var db = null;

/**
 *  @param {string} collectionName 
 *  @param {string} query 
 *  @param {function} callback 
 */
function remove( collectionName, query, callback )
{
    var collection = db.collection(collectionName);    
    collection.remove( _checkQuery(query), callback );
}
/**
 *  @param {string} collectionName
 *  @param {string} query
 *  @param {function} callback
 */
function safeRemove( collectionName, query, callback )
{
    get( collectionName, query, function (err, result) {
        if (err) return callback(err);
        if (result.length > 0 ){
            var archiveCollection = db.collection(collectionName+"Archive");
            archiveCollection.insert(result, function (err, result) {
                if (err) return callback(err);
                var collection = db.collection(collectionName);
                collection.remove( _checkQuery(query), callback );
            });
        } else {
            return callback("Nothing to remove");
        }
    });
}

function search( collectionName, query, query2, callback )
{
    if(typeof query !== "string")
    {
        return callback("Parameter 2 'query' must be a string.", null);
    }
    var collection = db.collection(collectionName);    
    collection.createIndex( { "$**": "text" } );

    query2 = query2 || {};

    query2[ "$text" ] = { $search: "\""+query+"\"" };

    collection.find( query2 ).toArray(function (error, result)
    {
        if (error) {
            return callback("Could not make database search request.");
        }
        callback( false, result );
    });
}

/**
 *  @param {string} collectionName 
 *  @param {string} query 
 *  @param {function} callback 
 */
function get( collectionName, query, callback )
{
    var collection = db.collection(collectionName);    
    collection.find( _checkQuery(query) ).toArray(function (error, result) {
        if (error) {
            return callback("Could not make database request.");
        }
        callback( false, result );
    });
}

/**
 *  @param {string} collectionName 
 *  @param {string} query 
 *  @param {function} callback 
 */
function exists( collectionName, query, callback )
{
    get(collectionName, query, function(error, data)
    {
        if(error)
        {
            return callback( error, data );
        }
        switch(data.length)
        {
            case 1: 
                callback(false, true, data[ 0 ]);
            break;
            case 0: 
                callback(false, false);
            break;
            default:
                callback("Conflict. Exist request on database has more than one hit!", data);
        }
    });
}

/**
 *  @param {string} collectionName 
 *  @param {string} query 
 *  @param {function} callback 
 */
function insert( collectionName, data, callback )
{
    var collection = db.collection(collectionName);
    collection.insert(data, callback);
}

/**
 *  @param {string} collectionName 
 *  @param {string} query 
 *  @param {function} callback 
 */
function insertArray( collectionName, dataArray, callback )
{   
    var countDownLatch = dataArray.length;
    var responseError = null;
    var responseData = [];
    var collection = db.collection(collectionName);
    dataArray.forEach(function(data)
    {
        collection.insert(data, function( error, data ) {
            countDownLatch--;
            if(error)
            {
                responseError = error;
            }
            responseData.push( data );
            if(countDownLatch <= 0)
            {
                callback( responseError, responseData );
            }
        });
    });    
}

/**
 *  @param {array} collectionNames
 *  @param {string/ObjectId} query
 *  @param {function} callback
 */
function backupCollections( collectionNames, query, callback )
{
    var countDownLatch = collectionNames.length;
    var responseError = null;
    var responseData = [];

    collectionNames.forEach(function (collectionName) {
        var collection = db.collection(collectionName);
        collection.find(_checkQuery(query)).toArray(function (error, result) {
            if (error) {
                return callback("Could not make database request.");
            }
            var collectionArchive = db.collection(collectionName + "Archive");
            if (result.length > 0) {
                collectionArchive.insert(result, function (err, data) {
                    countDownLatch--;
                    if (err) responseError = err;
                    responseData.push(data);
                    if (countDownLatch <= 0) {
                        callback(responseError, responseData);
                    }
                });
            }
            else {
                countDownLatch--;
                if (countDownLatch <= 0) {
                    callback(responseError, responseData);
                }
            }
        });
    });
}

/**
 *  @param {array} collectionNames
 *  @param {string/ObjectId} query
 *  @param {function} callback
 */
function delteInMoreCollections( collectionNames, query, callback )
{
    var countDownLatch = collectionNames.length;
    var responseError = null;
    var responseData = [];

    collectionNames.forEach(function(collectionName) {
        var collection = db.collection(collectionName);
        collection.remove(_checkQuery(query), function (error, result) {
            if (error) {
                responseError = error;
            }
            countDownLatch--;
            responseData.push(result);
            if (countDownLatch <= 0) {
                callback(responseError, responseData);
            }
        });
    });
}

/**
 *  @param {string} collectionName 
 *  @param {string} query 
 *  @param {object} properties
 *  @param {function} callback 
 */
function update( collectionName, query, properties, callback )
{
    var collection = db.collection(collectionName);    
    collection.update( _checkQuery(query) , { $set: properties }, callback);
}

/**
 *  @param {string|object} query 
 */
function _checkQuery( query )
{
    if(typeof query === "string")
    {
        if(query.length !== 24)
        {
            return callback(false, []);
        }
        query = { _id: new ObjectId( query ) };
    }
    return query;
}

function connect() {
    return new Promise(function (resolve, reject) {
        if (db !== null) {
            reject("db connections exists");
            return;
        }
        MongoClient.connect(config.dbPath, function (error, client)
        {
            if (error)
            {
                console.error("Could not connect to database...", error);
                reject();
                return;
            }
            console.log("Connected to database...");
            db = client.db("postar"); // newer version of mongo client
            resolve();
        });
    });
}

function makeId()
{
    return new ObjectId();
}

module.exports = {
    insert: insert,
    update: update,
    get: get,
    remove: remove,
    safeRemove: safeRemove,
    exists: exists,
    connect: connect,
    insertArray: insertArray,
    backupCollections: backupCollections,
    delteInMoreCollections: delteInMoreCollections,
    search: search,
    makeId: makeId
};