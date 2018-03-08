const Storage = require("./Storage");

class SecurityService
{
    static isAuthenticated() {
        const users = Storage.get("user", {});
        if( users.length !== 1 ) return false;
        
        console.log( "todo" );

    }
}

module.exports = SecurityService;