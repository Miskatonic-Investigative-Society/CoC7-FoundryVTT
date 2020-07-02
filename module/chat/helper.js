
export class chatHelper{
    static hyphenToCamelCase(string) {
        return string.replace(/-([a-z])/g, function(string) {
        return string[1].toUpperCase();
        });
    }
    

    static camelCaseToHyphen(string) {
        return string.replace(/([A-Z])/g, function(string) {
        return '-' + string.toLowerCase();
        });
    }

    static getActorFromKey(key) {

		// Case 1 - a synthetic actor from a Token
		if (key.includes(".")) {
		const [sceneId, tokenId] = key.split(".");
		const scene = game.scenes.get(sceneId);
		if (!scene) return null;
		const tokenData = scene.getEmbeddedEntity("Token", tokenId);
		if (!tokenData) return null;
		const token = new Token(tokenData);
		return token.actor;
		}

		// Case 2 - use Actor ID directory
		return game.actors.get(key) || null;
    }

    static attachObjectToElement( object, element){
        Object.keys(object).forEach( prop => {
            element.dataset[prop]= object[prop];
        })    
    }

    static getObjectFromElement( object, element){
        Object.keys(element.dataset).forEach( prop => {
            if( "true" == element.dataset[prop]) object[prop] = true;
            else if ( "false" == element.dataset[prop]) object[prop] = false;
            else if( "template" != prop) object[prop] = element.dataset[prop]; //ignore template
        })    
    }
}