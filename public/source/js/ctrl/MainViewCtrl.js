const $ = require("jquery");
const Authenticator = require("../service/Authenticator");
const Router = require("../service/Router");
const ViewHelper = require("../service/ViewHelper");

const minStartTime  = 1520451351897;
const pixelPerTime  = 60 * 1000;
const clickTolerance = 300;

// TODO: caluclate the timeframeIndex by screen widht
let timeframeIndex  = 8;
let start           = true;
let startTime       = Date.now() - (1000 * 60 * 60 * timeframeIndex);
let wallWidth       = (Date.now() - startTime) / pixelPerTime;
let oldWallWidth    = wallWidth;
let wallHeight      = 500; // todo: calculate by amount of users

class MainViewController {

    constructor()
    {
        this.name = "main";
        this.items = {};
        this.isTimeframeRefresh = false;
        this.spinnerNode = null;
        this.users = {};
    }

    routeChanged()
    {
        console.log("TODO: main routeChanged");
    }

    dettach()
    {
        this.items = [];
        ViewHelper.remove( this.logoutButton );
        ViewHelper.remove( this.boilerplate );
    }

    attach()
    {

        if( !Authenticator.isAuthenticated() )
        {
            Router.go("login");
        }

        this.lastUpdateTimestamp = null;        

        this.boilerplate = document.createElement("div");
        this.boilerplate.id = "area";        
        this.boilerplate.style.width = wallWidth + "px";
        this.boilerplate.style.height = wallHeight + "px";
        this.boilerplate.ondblclick = ( e ) => {
            
            const { top:topOffset, left:leftOffset } = this.boilerplate.getBoundingClientRect();
            const timestamp = Date.now();
            const xClicked = e.pageX;
            const xNow = (timestamp - startTime) / pixelPerTime;
            const offsetX = xClicked - xNow;
            const y = Math.round( e.pageY - topOffset );            

            if( Math.abs(offsetX) > clickTolerance)
            {
                return alert("Out of Range");
            }

            this.attachPost( xNow + offsetX, y, "", "", ( content, newContentNode ) => {
                this.saveNewPost.call( { contentNode: newContentNode, content: content, x: offsetX, y: y, timestamp: timestamp, context: this } , null );
            });        
        };

        this.bodyNode = document.getElementsByTagName("body")[ 0 ];
        this.bodyNode.appendChild( this.boilerplate );

        this.spinnerNode = ViewHelper.create( "div.loader", this.boilerplate );
        this.spinnerNode.innerHTML = "loading...";
        this.spinnerNode.style.display = "block";

        this.logoutButton = ViewHelper.create("button.logout", this.bodyNode);
        this.logoutButton.innerHTML = "Abmelden";
        this.logoutButton.onclick = e =>
        {
            Authenticator.logout();
        };

        start = true;

        this.loadData();
    }

    triggerNextTimeframe()
    {         
        if( Date.now() - (1000 * 60 * 60 * (timeframeIndex + 4)) < minStartTime )
        {
            return alert("End");
        }
        this.spinnerNode.style.display = "block";
        this.lastUpdateTimestamp = null;
        this.isTimeframeRefresh = true;
        timeframeIndex += 4; // jump 4 hours back       
        startTime = Date.now() - (1000 * 60 * 60 * timeframeIndex);
        oldWallWidth = wallWidth;
        wallWidth = (Date.now() - startTime) / pixelPerTime;        
        console.log(`newWallWidth=${wallWidth}, oldWallWidth=${oldWallWidth}, difference=${wallWidth - oldWallWidth}, timeframeIndex=${timeframeIndex}`);
    }

    applyScrollHandler()
    {
        window.onscroll = e =>
        {
            if( document.body.scrollLeft <= 0 && !this.isTimeframeRefresh )
            {
                this.triggerNextTimeframe();
            }
        };
    }

    saveNewPost()
    {
        this.contentNode.blur();
        this.contentNode.contentEditable = false;

        const content = this.content;
        const x = this.x;
        const y = this.y;
        const timestamp = this.timestamp;

        $.post("/api/post",  { content: content, x: x, y: y, timestamp: timestamp }).then((response) => {
            let { success, post } = response;
            this.contentNode.parentNode.parentNode.removeChild( this.contentNode.parentNode );
            let { _id, x:offsetX, y, content, timestamp } = post;
            let x = (timestamp - startTime) / pixelPerTime + parseInt(offsetX);
            if( this.context.items[ _id ] )
            {
                this.context.items[ _id ].node.style.left = `${x}px`;
                return;
            }                
            post.node = this.context.attachPost( x, y, content );
            this.context.items[ _id ] = post;
        }).catch(err => {
            // TODO: handle error
            console.error( err );
        });
    }

    attachPost( x, y, content, username, editableCallback )
    {        
        let newNode = document.createElement("div");
            newNode.className = "new-post";
            newNode.style.left = `${x}px`;
            newNode.style.top = `${y}px`;
            newNode.style.zIndex = Math.floor( Date.now() / 1000 ) - 1520443296;            

        let newContentNode = document.createElement("div");
            newContentNode.className = "content";

        if( typeof content === "string" )
        {
            newContentNode.innerHTML = "<small>" + username + "</small><br>" + content;
        }
        
        newNode.appendChild( newContentNode );

        if(typeof editableCallback === "function")
        {            
            newContentNode.contentEditable = true;
            newContentNode.onkeyup = (e) => {
                if( !e.shiftKey && e.keyCode === 13 )
                {                    
                    let inputText = newContentNode.innerHTML + "";
                    newContentNode.innerHTML = inputText.substring(0, inputText.length - 1);
                    editableCallback( inputText, newContentNode );                    
                    return false;
                }
            };        
        
            let newButtonNode = document.createElement("button");
                newButtonNode.className = "save-button";
                newButtonNode.onclick = (e) => {
                    let inputText = newContentNode.innerHTML + "";
                    editableCallback( inputText, newContentNode );                                            
                };
            
            newNode.appendChild( newButtonNode );
        }        
        this.boilerplate.appendChild( newNode );
        newContentNode.focus();
        return newNode;
    }

    loadUsers()
    {
        for (const userId in this.users) {
            if (this.users.hasOwnProperty(userId)) {
                const user = this.users[userId];
                if( !user.loaded && !user.isLoading )
                {
                    user.isLoading = true;
                    $.get("/api/user/" + userId ).then( response => {
                        // TODO: take user from response and put into users object...
                    });
                }
            }
        }
    }

    getUser( userId, callback )
    {
        if( !this.users[ userId ] )
        {
            this.users[ userId ] = "loading";
            $.get("/api/user/" + userId ).then( user => {
                this.users[ userId ] = user;
                callback( this.users[ userId ] );
            });
        }
        else if( this.users[ userId ] === "loading" )
        {
            setTimeout( () => {
                this.getUser.call( this, userId, callback );
            }, 500 );
        }
        else
        {
            callback( this.users[ userId ] );
        }
    }

    loadData()
    {
        // TODO: use WebSockets
        if( !this.active ) return;
        let url = "/api/post?starttime=" + startTime + ( this.lastUpdateTimestamp ? "&timestamp=" + this.lastUpdateTimestamp : "" );
        this.lastUpdateTimestamp = Date.now();
        
        $.get( url ).then( data => {
            data.forEach( item => {
                let { _id, x:offsetX, y, content, timestamp, userId } = item;
                let x = (timestamp - startTime) / pixelPerTime + parseInt(offsetX);
                if( this.items[ _id ] )
                {
                    this.items[ _id ].node.style.left = `${x}px`;
                    return;
                }
                
                this.getUser( userId, user => {
                    item.node = this.attachPost( x, y, content, user.username );
                    this.items[ _id ] = item;
                });
            });
            this.loadUsers();
            if( this.isTimeframeRefresh )
            {
                this.spinnerNode.style.display = "none";
                this.boilerplate.style.width = wallWidth + "px";
                window.scrollTo( wallWidth - oldWallWidth, 0 );
                this.isTimeframeRefresh = false;
            }            
            if ( start )
            {
                this.spinnerNode.style.display = "none";
                window.scrollTo( document.body.scrollWidth, 0 );
                start = false;
                this.applyScrollHandler();
            }
            console.log("data: ", data);
            setTimeout( this.loadData.bind( this ), 100 );
        }).catch((error) => {
            console.error("Cannot get data...");            
            setTimeout( this.loadData.bind( this ), 3000 );
        });
    }

}

module.exports = MainViewController;