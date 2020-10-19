import { CoC7Item } from './items/item.js';

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

	static skillCheckMacro( skill, event){
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);

		if( !actor){
			ui.notifications.warn( game.i18n.localize( 'CoC7.WarnNoActorAvailable'));
			return;
		}

		actor.skillCheck( skill, event.shiftKey);
	}

	static weaponCheckMacro( weapon, event){
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token]; //!! Ca recupere l'acteur pas l'acteur du token !!
		if (!actor) actor = game.actors.get(speaker.actor);

		if( !actor){
			ui.notifications.warn( game.i18n.localize( 'CoC7.WarnNoActorAvailable'));
			return;
		}
		
		actor.weaponCheck( weapon, event);
	}

	static async createMacro(bar, data, slot){
		if ( data.type !== 'Item' ) return;

		let item;
		let origin;
		let packName = null;

		if (data.pack) {
			const pack = game.packs.get(data.pack);
			if (pack.metadata.entity !== 'Item') return;
			packName = data.pack;
			item = await pack.getEntity(data.id);
			origin = 'pack';
		} else if (data.data) {
			item = data.data;
			origin = 'actor';
		} else {
			item = game.items.get(data.id);
			origin = 'game';
		}

		if( !item) return ui.notifications.warn( game.i18n.localize( 'CoC7.WarnMacroNoItemFound'));
		if( !('weapon' == item.type) && !('skill' == item.type)) return ui.notifications.warn( game.i18n.localize( 'CoC7.WarnMacroIncorrectType'));

		let command;

		if( 'weapon' == item.type){
			command = `game.CoC7.macros.weaponCheck({name:'${item.name}', id:'${item._id}', origin:'${origin}', pack: '${packName}'}, event);`;
		}

		if( 'skill' == item.type){
			if( CoC7Item.isAnySpec( item)) return ui.notifications.warn( game.i18n.localize( 'CoC7.WarnNoGlobalSpec'));
			command = `game.CoC7.macros.skillCheck({name:'${item.name}', id:'${item._id}', origin:'${origin}', pack: '${packName}'}, event);`;
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
		tool.title = game.settings.get('CoC7', 'developmentEnabled')? game.i18n.localize( 'CoC7.DevPhaseEnabled'): game.i18n.localize( 'CoC7.DevPhaseDisabled');
		ui.notifications.info( game.settings.get('CoC7', 'developmentEnabled')? game.i18n.localize( 'CoC7.DevPhaseEnabled'): game.i18n.localize( 'CoC7.DevPhaseDisabled'));
		ui.controls.render();
		game.socket.emit('system.CoC7', {
			type : 'updateChar'
		});
		CoC7Utilities.updateCharSheets();
	}

	static async toggleCharCreation(){
		const isCharCreation = game.settings.get('CoC7', 'charCreationEnabled');
		await game.settings.set( 'CoC7', 'charCreationEnabled', !isCharCreation);
		let group = ui.controls.controls.find(b => b.name == 'token');
		let tool = group.tools.find( t => t.name == 'charcreate');
		tool.title = game.settings.get('CoC7', 'charCreationEnabled')? game.i18n.localize( 'CoC7.CharCreationEnabled'): game.i18n.localize( 'CoC7.CharCreationDisabled');
		ui.notifications.info( game.settings.get('CoC7', 'charCreationEnabled')? game.i18n.localize( 'CoC7.CharCreationEnabled'): game.i18n.localize( 'CoC7.CharCreationDisabled'));
		ui.controls.render();
		game.socket.emit('system.CoC7', {
			type : 'updateChar'
		});		
		CoC7Utilities.updateCharSheets();
	}

	static updateCharSheets(){
		if( game.user.isGM){
			game.actors.entities.forEach( a => {
				if( 'character' == a?.data?.type && a?.sheet && a?.sheet?.rendered){
					a.render( false);
				}
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