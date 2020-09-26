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

		if( !actor){
			ui.notifications.warn('You do not have any actor controled nor selected');
			return;
		}

		actor.skillCheck( skillName, event.shiftKey);
	}

	static weaponCheckMacro( weapon, event){
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);

		if( !actor){
			ui.notifications.warn('You do not have any actor controled nor selected');
			return;
		}
		
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
				command: command
			});
		}
		game.user.assignHotbarMacro(macro, slot);
		return false;
	}

	static async toggleDevPhase(){
		const isDevEnabled = game.settings.get('CoC7', 'developmentEnabled');
		await game.settings.set( 'CoC7', 'developmentEnabled', !isDevEnabled);
		let group = ui.controls.controls.find(b => b.name == 'token');
		let tool = group.tools.find( t => t.name == 'devphase');
		tool.title = game.settings.get('CoC7', 'developmentEnabled')? 'Development phase enabled': 'Development phase disabled';
		ui.controls.render();
		game.socket.emit('system.CoC7', {
			type : 'updateChar'
		});
	}

	static async toggleCharCreation(){
		const isCharCreation = game.settings.get('CoC7', 'charCreationEnabled');
		await game.settings.set( 'CoC7', 'charCreationEnabled', !isCharCreation);
		let group = ui.controls.controls.find(b => b.name == 'token');
		let tool = group.tools.find( t => t.name == 'charcreate');
		tool.title = game.settings.get('CoC7', 'charCreationEnabled')? 'Character creation mode enabled': 'Character creation mode disabled';
		ui.controls.render();
		game.socket.emit('system.CoC7', {
			type : 'updateChar'
		});		
	}

	static updateCharSheets(){
		if( game.user.isGM){
			game.actors.entities.forEach( a => {
				if( a.isPC) a.render( false);
			});
		} else{
			game.actors.entities.forEach( a => {
				if( a.owner){
					a.render( false);
				}
			});
		}

		
		return;
	}
}