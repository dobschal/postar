"use strict";

const config = require( "../config" );
const hash = require("./hash/sha512");

class Authenticator
{
    /**
     *  Check if user has right user role and that token is valid.
     *  If not respond with error.
     *  @param {object} req 
     *  @param {object} res 
     *  @param {array} permitedUserRoles 
     *  @return {string} - user id
     */
    static secure( req, res, permitedUserRoles )
    {
        return new Promise( function(resolve, reject ) {
            const token = req.get("Auth-Token");
            if( !token )
            {
                return res.status( 401 ).send({ error: "Missing auth-token." });
            }

            let tokenBodyAsBase64 = token.split(".")[ 0 ];
            let tokenSignatureAsBase64 = token.split(".")[ 1 ];

            let tokenBodyAsString = Buffer.from(tokenBodyAsBase64, 'base64').toString('ascii');
            let realTokenSignature = Buffer.from(tokenSignatureAsBase64, 'base64').toString('ascii');

            let validTokenSignature = hash( tokenBodyAsString + config.secret );

            if( validTokenSignature !== realTokenSignature )
            {
                return res.status( 401 ).send({ error: "Token signature is wrong..." });
            }

            let tokenContent = JSON.parse( tokenBodyAsString );

            let { expiresAt = 0, role = "user", username = "", _id:userId } = tokenContent;

            if( expiresAt < Date.now() )
            {
                res.status( 401 ).send({ error: "Token is expired." });
            }

            if( !permitedUserRoles.includes( role ) )
            {
                res.status( 401 ).send({ error: "Wrong user role." });
            }

            resolve( userId );
        });
    }
}

module.exports = Authenticator;