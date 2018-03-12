const View = require("../service/ViewHelper");
const dialog = require("sweetalert");
const $ = require("jquery");
const Router = require("../service/Router");
const Authenticator = require("../service/Authenticator");

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
        this.boilerplate = View.create( "div#login-dialog", View.get("body"));

        this._addLoginForm();
        this._addRegistrationForm();
    }

    dettach()
    {
        View.remove( this.boilerplate );
    }

    _addLoginForm()
    {
        this.loginForm = View.create("form", this.boilerplate);
        this.loginForm.innerHTML = `
            <h2>Login</h2>
            <div class="input-group">
                <label>Username</label>
                <input type="text" id="login-username" placeholder="Username" />
            </div>
            <div class="input-group">
                <label>Passwort</label>
                <input type="text" id="login-password" placeholder="Passwort" />
            </div>
            <button type="submit" class
            ="primary">Anmelden</button>
        `;
        this.loginForm.onsubmit = e =>
        {
            const username = $("#login-username").val();
            const password = $("#login-password").val();
            $.post("/api/user/login", { username: username, password: password }).then( token => {
                Authenticator.persistToken( token );
                $.ajaxSetup({
                    headers: { 'Auth-Token': Authenticator.getToken() }
                });
                Router.go("main");
            }).catch( err => {
                dialog("Fehler", "Falsches Passwort?", "error");
            });
        };
    }

    _addRegistrationForm()
    {
        this.registrationForm = View.create("form", this.boilerplate);
        this.registrationForm.innerHTML = `
            <h2>Neuen Account anlegen</h2>
            <div class="input-group">
                <label>Username</label>
                <input type="text" id="registration-username" placeholder="Username" />
            </div>
            <div class="input-group">
                <label>Passwort</label>
                <input type="text" id="registration-password" placeholder="Passwort" />
            </div>
            <div class="input-group">
                <label>Passwort bestätigen</label>
                <input type="text" id="registration-password-repeat" placeholder="Passwort" />
            </div>
            <button type="submit" class="primary">Neu Anmelden</button>
        `;
        this.registrationForm.onsubmit = e =>
        {
            e.preventDefault();
            const username = $("#registration-username").val();
            const password = $("#registration-password").val();
            const passwordRepeat = $("#registration-password-repeat").val();
            if( password !== passwordRepeat ) return dialog("Passwort...", "Beide Passwörter müssen übereinstimmen.", "error");
            $.post("/api/user/add", { username: username, password: password }).then( response => {
                dialog("Du bist dabei :)", "Anmeldung war erfolgreich!", "success");
            }).catch( err => {
                dialog("Fehler", "Registrierung konnte nicht abgeschlossen werden.", "error");
            });
        };
    }
}

module.exports = LoginViewCtrl;