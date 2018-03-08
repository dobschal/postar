
let locks = {};

class Storage
{
    
    // - - - - - - - - - - - - PUBLIC - - - - - - - - - - - - 

    static remove( collection, query )
    {
        if( locks[ collection] ) throw Error("DB Error: Tried to change locked collection.");
        locks[ collection ] = true;
        const contentAsString = window.localStorage.getItem( collection );
        if( !contentAsString ) return true;
        const content = JSON.parse( contentAsString );
        if( !Array.isArray( content ) ) return true;        
        let stil = content.filter( item => {
            return !this._resolvesQuery( item, query );
        });
        const itemsAsString = JSON.stringify( stil );
        window.localStorage.setItem( collection, itemsAsString );
        locks[ collection ] = false;
    }

    static get( collection, query )
    {
        const contentAsString = window.localStorage.getItem( collection );
        if( !contentAsString ) return [];
        const content = JSON.parse( contentAsString );
        if( !Array.isArray( content ) ) return [];        
        return content.filter( item => {
            return this._resolvesQuery( item, query );
        });
    }

    static exists( collection, query )
    {
        const values = this.get( collection, query );
        return ( values.length > 0 );
    }

    static insert( collection, obj )
    {
        if( locks[ collection] ) throw Error("DB Error: Tried to change locked collection.");
        locks[ collection ] = true;
        if( typeof obj._id === "undefined" )
        {
            obj._id = this._uuidv4();
        }
        if( this.exists( collection, { _id: obj._id } ) )
        {
            throw new Error( `DB Error: Tried to insert item to collection '${collection}' with already existing uid.` );
        }
        const items = this.get( collection, {} );
        items.push( obj );
        const itemsAsString = JSON.stringify( items );
        window.localStorage.setItem( collection, itemsAsString );
        locks[ collection ] = false;
    }

    static update( collection, query, updates )
    {
        if( locks[ collection] ) throw Error("DB Error: Tried to change locked collection.");
        locks[ collection ] = true;
        const items = this.get( collection, {} );
        const updatedItems = items.map( item => {
            if( this._resolvesQuery( item, query ) )
            {
                for (const key in updates) {
                    if (updates.hasOwnProperty(key)) {
                        item[ key ] = updates[ key ];
                    }
                }
            }
            return item;
        });
        const itemsAsString = JSON.stringify( updatedItems );
        window.localStorage.setItem( collection, itemsAsString );        
        locks[ collection ] = false;
    }

    static set( collection, query, obj )
    {
        if( locks[ collection] ) throw Error("DB Error: Tried to change locked collection.");
        locks[ collection ] = true;
        const items = this.get( collection, {} );
        const updatedItems = items.map( item => {
            if( this._resolvesQuery( item, query ) )
            {
                return obj;
            }
            return item;
        });
        const itemsAsString = JSON.stringify( updatedItems );
        window.localStorage.setItem( collection, itemsAsString );        
        locks[ collection ] = false;
    }

    // - - - - - - - - - - - - PRIVATE - - - - - - - - - - - - 

    static _resolvesQuery( item, query )
    {
        let fitsPattern = true;
        for (const key in query)
        {                    
            if( query.hasOwnProperty(key) && ( typeof item[ key ] === "undefined" || item[ key ] !== query[ key ] ) )
            {
                fitsPattern = false;
                break;
            }
        }
        return fitsPattern;
    }

    static _uuidv4()
    {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
}

module.exports = Storage;