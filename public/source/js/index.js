const Router = require("./service/Router");
const routing = require("./config/routing");
const $ = require("jquery");
const Authenticator = require("./service/Authenticator");

// Start...

if( Authenticator.isAuthenticated())
{
    $.ajaxSetup({
        headers: { 'Auth-Token': Authenticator.getToken() }
    });
}

Router.applyRouting( routing );
