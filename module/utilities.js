export class CoC7Utilities {
	static test(event){
		if( event.shiftKey) ui.notifications.info('Hello from SHIFT utilities');
		else ui.notifications.info('Hello from utilities');
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);

		actor.inflictMajorWound();
	}

	static skillCheckMacro( skillName, event){
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);

		actor.skillCheck( skillName, event.shiftKey);
	}

	static weaponCheckMacro( weapon, event){
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);

		actor.weaponCheck( weapon, event);
	}

	static async createMacro(bar, data, slot){
		if ( data.type !== 'Item' ) return;
		if (!( 'data' in data ) ) return ui.notifications.warn('You can only create macro buttons for owned Items');
		const item = data.data;

		let command;

		if( 'weapon' == item.type){
			command = `game.CoC7.macros.weaponCheck({name:'${item.name}', id:'${item._id}'}, event);`;
			
		}

		if( 'skill' == item.type){
			command = `game.CoC7.macros.skillCheck('${item.name}', event);`;
		}

		// Create the macro command
		let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
		if ( !macro ) {
			macro = await Macro.create({
				name: item.name,
				type: 'script',
				img: item.img,
				command: command,
				flags: {'dnd5e.itemMacro': true}
			});
		}
		game.user.assignHotbarMacro(macro, slot);
		return false;
	}

}