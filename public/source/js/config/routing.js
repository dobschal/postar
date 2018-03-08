const controllers = [
    require("../ctrl/MainViewCtrl"),
    require("../ctrl/LoginViewCtrl")
];

const routes = {       
    'login': [ 'login', 'main' ],
    '*': [ 'main' ]
};

module.exports.routes = routes;
module.exports.controllers = controllers;