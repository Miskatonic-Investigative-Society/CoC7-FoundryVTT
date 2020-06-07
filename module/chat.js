import { CoC7Item } from './items/item.js'
import { CoC7Dice } from './dice.js'
import { CoC7Check } from './check.js'

export class CoC7Chat{

    //TODO remplacer les getElementsByxxxx par querySelector
    
    /* -------------------------------------------- *
     *  Init sockets                                *
     *----------------------------------------------*/

    static ready()
    {
        console.log('-->CoC7Chat.ready');
        game.socket.on('message', function (data){console.log(data);});
    }

    static onMessage( data) {
        console.log('-->CoC7Chat.onMessage');
        console.log(`message received send&er :${data.user} message type : ${data.action} for message :${data.messageId}`);
    }

    /* -------------------------------------------- *
     *  Chat Message Helpers                        *
     * -------------------------------------------- */



    static chatListeners(app, html, data) {
        console.log('-->CoC7Chat.chatListeners');
        html.on('click', '.card-buttons button', CoC7Chat._onChatCardAction.bind(this));
        html.on('click', '.card-header', CoC7Chat._onChatCardToggleContent.bind(this));
        html.on('click', '.radio-switch', CoC7Chat._onChatCardRadioSwitch.bind(this));
        html.on('click', '.panel-switch', CoC7Chat._onChatCardToggleSwitch.bind(this))
    }

    static _onChatCardRadioSwitch( event){
        console.log('-->CoC7Chat._onChatCardRadioSwitch');
        event.preventDefault();
        let optionList = event.currentTarget.parentElement.getElementsByClassName('radio-switch');
        let index;
        for (index = 0; index < optionList.length; index++) {
            let element = optionList[index];
            if( element.dataset.property == event.currentTarget.dataset.property){
                element.classList.add('switched-on');
            }
            else{
                element.classList.remove('switched-on');
            }
        }
        event.currentTarget.parentElement.dataset.selected = event.currentTarget.dataset.property;
    }

    static _onChatCardToggleSwitch( event){
        console.log('-->CoC7Chat._onChatCardToggleSwitch');
        event.preventDefault();
        let visible = event.currentTarget.parentElement.dataset.selected == "true" ? true : false;
        let panel = event.currentTarget.parentElement.getElementsByClassName( 'panel-content');
        if( visible){
            //hide panel
            event.currentTarget.classList.remove('switched-on');
            panel[0].style.display = 'none';
            event.currentTarget.parentElement.dataset.selected = false;
        }
        else
        {
            //show panel
            event.currentTarget.classList.add('switched-on');
            panel[0].style.display = 'block';
            event.currentTarget.parentElement.dataset.selected = true;
        }
    }

    static messageListeners(app, html, data) {
        console.log('-->CoC7Chat.messageListeners');
        const gmOnly = html.find('.gm-only');
        for( let zone of gmOnly )
        {
            if( !game.user.isGM){ zone.style.display = "none"};
        }

        if( !game.user.isGM) // GM can see everything
        {
            const ownerOnly = html.find('.owner-only');
            for( let zone of ownerOnly )
            {
                let actorId = zone.dataset.actorId;
                let actor = game.actors.get( actorId);
                if( !actor.owner) {zone.style.display = "none"} //if current user doesn't own this he can't interract
            }
        }

        const backersDropZone = html.find("#backers");
        const advresariesDropZone = html.find('#adversaries');
        const protagonists = html.find('.roll-protagonist');

        for( let protagonist of protagonists)
        {
            // $(protagonist).hover(function(){
            //     $(this).css("background-color", "yellow");
            //     }, function(){
            //     $(this).css("background-color", "transparent");
            // });

            protagonist.addEventListener('contextmenu', event => this._onContextMenu( event), false);
            protagonist.addEventListener('dragstart', event => this._onDragItemStart(event), false)

        }

        if( backersDropZone.length != 0){
            backersDropZone[0].addEventListener('drop', event => CoC7Chat._onDrop( event));
            // backersDropZone[0].addEventListener('dragenter', function( event ) { event.target.style.background = "blue"; }, false);
            // backersDropZone[0].addEventListener('dragleave', function( event ) { event.target.style.background = ""; }, false);
        }

        if( advresariesDropZone.length != 0){
            advresariesDropZone[0].addEventListener('drop', event => CoC7Chat._onDrop( event));
            // advresariesDropZone[0].addEventListener('dragenter', function( event ) { event.target.style.background = "red"; }, false);
            // advresariesDropZone[0].addEventListener('dragleave', function( event ) { event.target.style.background = ""; }, false);
        }
    }

    static async _onContextMenu(event) {
        console.log('-->CoC7Chat._onContextMenu');

        const HTMLmessage = event.currentTarget.closest(".message");
        const dropZoneName = event.currentTarget.parentElement.getAttribute("id");
        const itemId = event.currentTarget.dataset.itemId;

        CoC7Chat.removeFromProtagonists( HTMLmessage, dropZoneName, itemId);
    }

    static removeFromProtagonists( HTMLmessage, side, itemId){
        // const oldChatMessage = game.messages.get( chatMessageId);
        // let oldMessageHTML = document.createElement('div');
        // oldMessageHTML.innerHTML = oldChatMessage.data.content;
        // let newHTMLMessage = oldMessageHTML.firstChild;

        let chatCard = HTMLmessage.getElementsByClassName('chat-card')[0];
        let protagonistsList = chatCard.getElementsByTagName('div')[side];

        const protagonistsArray = [...protagonistsList.children];

        const element = protagonistsArray.find( element => element.dataset.itemId == itemId);
        element.remove();

        let newMessage = {
            user: game.user._id,
            hideData: true,
            content: chatCard.outerHTML
        }

        const chatMessageId = HTMLmessage.dataset.messageId;
        const chatMessage = game.messages.get( chatMessageId);


        let newChatMessage = chatMessage.update(newMessage);
        ui.chat.updateMessage( newChatMessage, false);
    }

    static async _onDragItemStart( event){
        console.log('-->CoC7Chat._onDragItemStart');
        const itemId = event.currentTarget.dataset.itemId;
        const actorId = event.currentTarget.dataset.actorId;
        const tokenId = event.currentTarget.dataset.tokenId;
        const HTMLmessage = event.currentTarget.closest(".message");
        const chatMessageId = HTMLmessage.dataset.messageId;
        const side = event.currentTarget.parentElement.getAttribute("id");

        var transferedData = {
			'itemId': itemId,
			'actorId': actorId,
            'token': tokenId ? tokenId : null,
            'origin': 'ChatMessage',
            'chatMessageId': chatMessageId
		}
        event.dataTransfer.setData("text", JSON.stringify( transferedData));

        //CoC7Chat.removeFromProtagonists( HTMLmessage, side, itemId);
        //TODO : transferer l'effacement de la liste d'origine apres que l'élément est été créé.
    }

    static getActorFromToken( tokenKey)
    {
        const token = CoC7Chat.getToken( tokenKey);
        return token ? token.actor : null;
    }

    static getToken( tokenKey){
    	if (tokenKey) {
			const [sceneId, tokenId] = tokenKey.split(".");
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity("Token", tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
            return token;
        }
        return null;
    }


    static async _onDrop( event) {
        console.log('-->CoC7Chat._onDrop');
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }

        const token = this.getToken( data.token);
        const actor = token ? token.actor : game.actors.get( data.actorId);
        const item = actor.getOwnedItem( data.itemId);

        const dropZone = event.currentTarget;
        const dropZoneName = dropZone.getAttribute("id");
        const message = dropZone.closest(".message");
        const messageId = message.dataset.messageId;

        // if( !CoC7Chat.messageContainsItem( messageId, data.itemId))
        // {
            const templateData = {
                img: 'icons/svg/mystery-man.svg',
                actor: actor,
                item: item,
                tokenId: data.token ? data.token : null,
                token: token
            }

            const template = 'systems/CoC7/templates/chat/parts/item.html';
            const htmlItem = await renderTemplate(template, templateData);

            let oldMesssage = game.messages.get(messageId);
            // let oldMessageHtml = document.createElement('div');
            // oldMessageHtml.innerHTML = dropZone.closest('.chat-card').outerHTML;
            let newHtmlMessage = dropZone.closest('.chat-card');

            let foo = newHtmlMessage.getElementsByTagName('div')[dropZoneName];
            foo.insertAdjacentHTML('beforeend', htmlItem);

            let newMessage = {
                user: game.user._id,
                hideData: true,
                content: newHtmlMessage.outerHTML
            }

            let resultMsg = oldMesssage.update(newMessage);
            ui.chat.updateMessage( resultMsg, false);
        // }
    }
    
    static updateChatCard( card){
        const messageId = card.closest('.message').dataset.messageId;
        let oldMessage = game.messages.get( messageId);
        let newMessage = {
            user: game.user._id,
            hideData: true,
            content: card.outerHTML
        }

        let resultMsg = oldMessage.update(newMessage);
        ui.chat.updateMessage( resultMsg, false);
    }


    static parseChatCard( card)
    {
        //TODO control de validité des éléments
        //TODO implement
        const rollType = card.children.rolltype.dataset.selected;
        const backersList = card.getElementsByClassName("backers-list").backers.children;
        const backersCondition = card.getElementsByClassName("adversaries-condition").adversariescondition.dataset.selected;
        const adversariesList = card.getElementsByClassName("backers-list").backers.children;
        const adversariesCondition = card.getElementsByClassName("adversaries-condition").adversariescondition.dataset.selected;
        const chatMessageId = card.closest(".message").dataset.messageId;
        const actorId = card.dataset.actorId;
        const itemId = card.dataset.itemId;
        const tokenId = card.dataset.tokenId;
        const value = card.dataset.value;
        
        const hasBackers = card.querySelector("#backerspanel").dataset.selected;
        const hasAdversaries = card.querySelector("#adversariespanel").dataset.selected;

        let index;
        let backers = [];
        let adversaries = [];
        for (index = 0; index < backersList.length; index++) backers.push(Object.assign({}, backersList[index].dataset));
        for (index = 0; index < adversariesList.length; index++) adversaries.push(Object.assign({}, backersList[index].dataset));

        let actors = {};
        actors.main = {};
        actors.main.itemId = itemId;
        actors.main.actorId = actorId;
        actors.main.value = value;
        actors.main.tokenId = tokenId;
        actors.backers = backers;
        actors.adversaries = adversaries;

        let victoryConditions = {};
        victoryConditions.backers = backersCondition;
        victoryConditions.adversaries = adversariesCondition;

        CoC7Dice.skillRoll( rollType, actors, victoryConditions, chatMessageId);

        return null;
    }

    /**
     * Handle execution of a chat card action via a click event on one of the card buttons
     * @param {Event} event       The originating click event
     * @returns {Promise}         A promise which resolves once the handler workflow is complete
     * @private
     */
    
    static async _onChatCardAction(event) {

        console.log('-->CoC7Chat._onChatCardAction');
        event.preventDefault();

        const button = event.currentTarget;
        const card = button.closest(".chat-card");
        const action = button.dataset.action;
        // const roll = CoC7Chat.parseChatCard( card);


        // Get the Actor from a synthetic Token
        const actor = CoC7Item._getChatCardActor(card);
        if ( !actor ) return;

        const item = actor.getOwnedItem(card.dataset.itemId);
        const skill = actor.getOwnedItem( card.dataset.skillId);
        // if ( !item ) {
        //     return ui.notifications.error(`The requested item ${card.dataset.itemId} no longer exists on Actor ${actor.name}`)
        // }
        switch( action){
            case "useLuck":
                //ui.notifications.info("spending luck");
                const luckAmount = parseInt(button.dataset.luckAmount);

                // let test = ;
                if( await actor.spendLuck( luckAmount)){
                    let result = card.querySelector('.dice-total');
                    result.innerText = `${luckAmount} luck spent to pass`;
                    result.classList.replace( 'failure', 'success');
                    result.classList.remove( 'fumble');
                    card.querySelector('.card-buttons').remove();
                    CoC7Chat.updateChatCard( card);
                }
                else
                    ui.notifications.error(`${actor.name} didn't have enough luck to pass the check`);
                break;

            case "push":
                let result = card.querySelector('.dice-total');
                result.innerText = result.innerText + ` pushing skill`;
                result.classList.remove('failure');
                card.querySelector('.card-buttons').remove();
                CoC7Chat.updateChatCard( card);
                CoC7Check.push( card);
                //ui.notifications.info("pushing skill");
                break;

        }
        console.log(`button ${action} clicked for actor ${actor.name} with skill ${skill.name} at ${skill.data.data.value}`);
    }

    /**
	 * Handle toggling the visibility of chat card content when the name is clicked
	 * @param {Event} event   The originating click event
	 * @private
	*/
    static _onChatCardToggleContent(event) {
        console.log('-->CoC7Chat._onChatCardToggleContent');
		event.preventDefault();
		const header = event.currentTarget;
		const card = header.closest(".chat-card");
		const content = card.querySelector(".card-content");
		content.style.display = content.style.display === "none" ? "block" : "none";
    }
    
    /**
     * TODO : unclear, confusion itemId générique et ne dépend pas de l'acteur (plusieurs acteur avec meme itemId)
     * @param {*} messageId 
     * @param {*} itemId 
     */
    static messageContainsItem( messageId, itemId){
        const chatMessage = game.messages.get( messageId);
        return !chatMessage ? false : chatMessage.data.content.includes( itemId);
    }


    static getSceneControlButtons(buttons) {
        console.log('-->CoC7Chat.getSceneControlButtons');
		let tokenButton = buttons.find(b => b.name == "token")

		if (tokenButton) {
			tokenButton.tools.push({
				name: "request-roll",
				title: "Request Roll",
				icon: "fas fa-dice",
				visible: game.user.isGM,
				onClick: () => CoC7Chat.createChatCard()
			});
		}
    }
    
    static async createChatCard(){
        const token = this.actor.token;
		const templateData = {
			actor: this.actor,
			tokenId: token ? `${token.scene._id}.${token.id}` : null,
			item: this.data
		}

		const template = `systems/CoC7/templates/chat/skill-card.html`;
		const html = await renderTemplate(template, templateData);
				
		// TODO change the speaker for the token name not actor name
		const speaker = ChatMessage.getSpeaker({actor: this.actor});
		if( token) speaker.alias = token.name;

		const test = await ChatMessage.create({
			user: game.user._id,
			speaker,
			content: html
		});
    }

}