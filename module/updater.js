export class Updater{
	static async checkForUpdate() {
		const systemUpdateVersion = game.settings.get('CoC7', 'systemUpdateVersion');
		const updaterequired =  0 == systemUpdateVersion;
		if( updaterequired){
			if( game.user.isGM){
				new Dialog({
					title: 'Update required',
					content: `<p>An update is required for your version ${game.system.data.version}. Please backup your world folder before starting the upgrade.`,
					buttons: {
						update: {
							label : 'Update',
							callback : async () => Updater.update()
						},
						skip : {
							label : 'Skip',
							callback: () => {return;}
						}
					}
				}).render(true);
			}else {
				new Dialog({
					title: 'Update required',
					content: `<p>An update is required for your version ${game.system.data.version}. Please wait for your GM to update the system then refresh (F5) this page.`,
					buttons: {
						OK : {
							label : 'OK',
							callback: () => {return;}
						}
					}
				}).render(true);
			}
		}
	}

	static async update(){
		for (let actor of game.actors.entities)
		{
			await Updater.updateActor(actor);
		}
		game.settings.set('CoC7', 'systemUpdateVersion', '0.1');
	}
    
	static async updateActor( actor){
		if( 'character' == actor.data.type){
			for (let item of actor.items)
			{
				if( 'skill' == item.data.type && item.data.data.value){
					const exp = item.data.data.adjustments?.experience ? parseInt(item.data.data.adjustments.experience) : 0;
					await actor.updateEmbeddedEntity('OwnedItem', {
						_id: item._id,
						'data.adjustments.experience': exp + parseInt( item.data.data.value) - item.value,
						'data.value': null
					});
				}
			}
		}
	}
}