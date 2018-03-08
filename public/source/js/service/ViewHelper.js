class ViewHelper
{
    static get( query )
    {
        return document.querySelector( query );
    }

    static remove( node )
    {
        node.parentNode.removeChild( node );
    }

    static create( query, parent )
    {
        let tagName = "";
        let classes = [];
        let id = "";
        let splitted1 = query.split("#");
        let splitted2 = splitted1[0].split(".");
        for( let i = 0; i < splitted2.length; i++ )
        {
            if( i === 0)
            {
                tagName = splitted2[ i ];
            }
            else
            {
                classes.push(splitted2[ i ]);
            }
        }
        if( splitted1[1] )
        {
            let splitted3 = splitted1[1].split(".");
            for( let i = 0; i < splitted3.length; i++ )
            {
                if( i === 0)
                {
                    id = splitted3[ i ];
                }
                else
                {
                    classes.push(splitted3[ i ]);
                }
            }
        }
        let node = document.createElement( tagName );
        node.className = classes.join(" ");
        node.id = id;
        if( parent )
        {
            parent.appendChild( node );
        }
        return node;
    }
}

module.exports = ViewHelper;