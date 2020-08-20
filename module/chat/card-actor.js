import { chatHelper} from './helper.js';

export class ChatCardActor{
	constructor(actorKey = null, fastForward = false) {
		this.actorKey = actorKey;
		this.fastForward = fastForward;
	}
 
    
	get isBlind(){
		if( !this.rollMode) return null;
		return 'blindroll' === this.rollMode;
	}

	get rollMode(){
		if( !this._rollMode) this._rollMode = game.settings.get('core', 'rollMode');
		return this._rollMode;
	}

	set rollMode(x){
		this._rollMode = x;
	}
    
	get actor(){
		if( !this.actorKey) return null;
		return chatHelper.getActorFromKey( this.actorKey);
	}

	get token(){
		if( !this.actor) return null;
		return chatHelper.getTokenFromKey(this.actorKey);
	}

	get item(){
		if( !this.itemId) return null;
		return this.actor.getOwnedItem( this.itemId);
	}

	get weapon(){
		return this.item;
	}

	get targetedTokens(){
		return [...game.user.targets];
	}
    
	get target(){
		if( this.targetToken) return this.targetToken;
		return this.targetActor;
	}

	/**
     * If a targetKey was provided try to find a token with that key and use it.
     * If not targetKey provided return the first target.
     */
	get targetToken(){
		if( !this._targetToken){
			if( this._targetKey)
			{
				this._targetToken = chatHelper.getTokenFromKey( this._targetKey);
			} else {
				this._targetToken = this.targetedTokens.pop();
				if( this._targetToken) this._targetKey = `${this._targetToken.scene._id}.${this._targetToken.id}`;
				else {
					this._targetToken = null;
				}
			}
		}
		return this._targetToken;
	}
    
	get targetActor(){
		if( !this._targetActor){
			if( this.targetToken) this._targetActor = this.targetToken.actor;
			else this._targetActor = chatHelper.getActorFromKey( this._targetKey);
		}
		return this._targetActor;
	}

	get targetKey(){
		if( !this.targetToken && !this.targetActor) return null;
		return this._targetKey;
	}
    
	get hasTarget(){
		if( !this.targetToken && !this.targetActor) return false;
		return true;
	}

	set targetKey(x){
		this._targetKey = x;
	}

	get skills(){
		return this.actor.getWeaponSkills( this.itemId);
	}

	get targetImg(){
		const img =  chatHelper.getActorImgFromKey( this.targetKey);
		if( img ) return img;
		return '../icons/svg/mystery-man-black.svg';
	}
    
	get name(){
		if( this.token) return this.token.name;
		return this.actor.name;
	}
    
	get targetName(){
		if( !this.target) return 'dummy';
		return this.target.name;        
	}

	get actorImg(){
		const img =  chatHelper.getActorImgFromKey( this.actorKey);
		if( img ) return img;
		return '../icons/svg/mystery-man-black.svg';
	}
}