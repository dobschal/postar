const $ = require("jquery");


class MainViewController {

    constructor()
    {
        this.name = "main";
    }

    routeChanged()
    {
        console.log("main routeChanged");
    }

    dettach()
    {
        // todo: stop loadData and remove nodes...
    }

    attach()
    {
        this.lastUpdateTimestamp = null;

        this.boilerplate = document.createElement("div");
        this.boilerplate.id = "area";        
        this.boilerplate.ondblclick = ( e ) => {
            
            const { top:topOffset, left:leftOffset } = this.boilerplate.getBoundingClientRect();

            const x = Math.round( e.pageX - leftOffset );
            const y = Math.round( e.pageY - topOffset );

            this.addContentNode( x, y, true );        
        };

        this.bodyNode = document.getElementsByTagName("body")[ 0 ];
        this.bodyNode.appendChild( this.boilerplate );

        this.loadData();
    }

    saveNewPost()
    {
        this.contentNode.blur();
        this.contentNode.contentEditable = false;

        const content = this.contentNode.innerHTML;
        const x = this.x;
        const y = this.y;

        $.post("/api/post",  { content: content, x: x, y: y }).then((response) => {
            this.contentNode.parentNode.parentNode.removeChild( this.contentNode.parentNode );
        }).catch(err => {
            // TODO: handle error
            console.error( err );
        });
    }

    addContentNode( x, y, editable, content )
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
            newContentNode.innerHTML = content;
        }
        
        newNode.appendChild( newContentNode );

        if(editable)
        {
            newContentNode.contentEditable = true;
            newContentNode.onkeyup = (e) => {
                if( !e.shiftKey && e.keyCode === 13 )
                {
                    let inputText = newContentNode.innerHTML + "";
                    newContentNode.innerHTML = inputText.substring(0, inputText.length - 1);
                    this.saveNewPost.call( { contentNode: newContentNode, x: x, y: y } , null );
                    return false;
                }
            };        
        
            let newButtonNode = document.createElement("button");
                newButtonNode.className = "save-button";
                newButtonNode.onclick = this.saveNewPost.bind( { contentNode: newContentNode, x: x, y: y } );
            
            newNode.appendChild( newButtonNode );
        }        
        this.boilerplate.appendChild( newNode );
        newContentNode.focus();
    }

    loadData()
    {
        // TODO: use WebSockets
        let url = "/api/post" + ( this.lastUpdateTimestamp ? "?timestamp=" + this.lastUpdateTimestamp : "" );
        this.lastUpdateTimestamp = Date.now();
        $.get( url ).then( data => {
            data.forEach( item => {
                let { x, y, content } = item;
                this.addContentNode( x, y, false, content );
            });
            setTimeout( this.loadData.bind( this ), 1000 );
        }).catch((error) => {
            console.error("Cannot get data...");
            setTimeout( this.loadData.bind( this ), 1000 );
        });
    }

}

module.exports = MainViewController;