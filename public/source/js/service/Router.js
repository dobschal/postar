const Navigo = require("navigo");
const navigo = new Navigo( null, true );

class Router
{
    // - - - - - - - - - - - - - - - - - PUBLIC - - - - - - - - - - - - - - - - - 

    static go( routeName )
    {
        navigo.navigate( routeName );
    }

    static applyRouting( routing )
    {             
        let realRouting = {};
        routing.controllers = routing.controllers.map( Controller => {
            return new Controller();
        });
        for (const path in routing.routes)
        {
            if (routing.routes.hasOwnProperty(path))
            {                
                let arrayOfControllerNames = routing.routes[path];
                let routeControllers = this._controllersFromNames( routing, arrayOfControllerNames );
                realRouting[ path ] = this._makeRouteFunction( routing, arrayOfControllerNames, routeControllers );
            }
        }
        navigo.on( realRouting ).resolve();
    }

    // - - - - - - - - - - - - - - - - - PRIVATE - - - - - - - - - - - - - - - - - 

    static _makeRouteFunction( routing, arrayOfControllerNames, routeControllers )
    {
        return ( params, query ) => {

            // dettach controllers
            routing.controllers.forEach( controller => {
                if( !arrayOfControllerNames.includes( controller.name ) && controller.active )
                {
                    controller.active = false;
                    controller.dettach( params, query );
                }
            });

            // attach controllers
            routeControllers.forEach( routeController => {
                if( routeController.active )
                {
                    routeController.routeChanged( params, query );
                }
                else
                {
                    routeController.active = true;
                    routeController.attach( params, query );
                }
            });
        };
    }
    
    static _controllersFromNames( routing, arrayOfControllerNames )
    {
        let routeControllers = [];
        arrayOfControllerNames.forEach( controllerName => {
            let ctrl = this._controllerFromRouting( routing, controllerName );
            if( !ctrl ) throw new Error(`Unknown controller '${controllerName}'...`);
            routeControllers.push( ctrl );
        });
        return routeControllers;
    }

    static _controllerFromRouting( routing, name )
    {
        return routing.controllers.find( controller => {
            return controller.name === name;
        });
    }
}

module.exports = Router;