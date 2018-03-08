const Storage = require("./Storage");

class Authenticator
{
    static isAuthenticated()
    {
        const users = Storage.get("user", {});
        if( users.length !== 1 ) return false;
        const user = users[ 0 ];
        if( user.expiresAt < Date.now() )
        {
            Storage.remove("user", {});
            return false;
        }
        return true;
    }

    static persistToken( token )
    {
        let userAsBase64String = token.split(".")[ 0 ];
        let userAsString = atob( userAsBase64String );
        let user = JSON.parse( userAsString );
            user.token = token;
        Storage.insert("user", user);
    }
}

module.exports = Authenticator;