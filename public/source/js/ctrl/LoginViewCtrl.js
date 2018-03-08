class LoginViewCtrl
{
    constructor()
    {
        this.name = "login";
    }

    routeChanged()
    {
        console.log("routeChanged");
    }

    attach()
    {
        console.log("attach login");
    }

    dettach()
    {
        console.log("dettach login");
    }
}

module.exports = LoginViewCtrl;