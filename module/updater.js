export class Updater{
	static async checkForUpdate() {
		// if( game.system.data.version >= '0.5' && 0 == game.settings.get('CoC7', 'systemUpdateVersion')){
		//	await game.settings.set('CoC7', 'systemUpdateVersion', '0.1');
		// }
		let systemUpdateVersion = game.settings.get('CoC7', 'systemUpdateVersion');
		if (systemUpdateVersion == '0.1') {
			systemUpdateVersion = 1;
		} else {
			systemUpdateVersion = parseInt(systemUpdateVersion);
		}
		if (systemUpdateVersion < 2) {
			if (game.user.isGM) {
				new Dialog({
					title: 'Update required',
					content: `<p>An update is required for your version ${game.system.data.version}. Please backup your world folder before starting the upgrade.`,
					buttons: {
						update: {
							label: 'Update',
							callback: async () => Updater.update(systemUpdateVersion)
						},
						skip: {
							label: 'Skip',
							callback: () => { return; }
						}
					}
				}).render(true);
			} else {
				new Dialog({
					title: 'Update required',
					content: `<p>An update is required for your version ${game.system.data.version}. Please wait for your GM to update the system then refresh (F5) this page.`,
					buttons: {
						OK: {
							label: 'OK',
							callback: () => { return; }
						}
					}
				}).render(true);
			}
		}
	}

	static async update(systemUpdateVersion) {
		for (let actor of game.actors.entities) {
			await Updater.updateActor(systemUpdateVersion, actor);
		}
		game.settings.set('CoC7', 'systemUpdateVersion', '2');
	}

	static async updateActor (systemUpdateVersion, actor) {
		if ('character' === actor.data.type) {
			for (let item of actor.items) {
				switch (systemUpdateVersion) {
				case 0:
					if ('skill' === item.data.type && item.data.data.value) {
						const exp = item.data.data.adjustments?.experience ? parseInt(item.data.data.adjustments.experience) : 0;
						await actor.updateEmbeddedEntity('OwnedItem', {
							_id: item._id,
							'data.adjustments.experience': exp + parseInt(item.data.data.value) - item.value,
							'data.value': null
						});
					}
					break;
				}
			}
			switch (systemUpdateVersion) {
			case 1:
				if (typeof actor.data.data.attribs.san.oneFifthSanity === 'undefined' || actor.data.data.attribs.san.oneFifthSanity === null) {
					await actor.update({
						'data.attribs.san.dailyLoss': 0,
						'data.attribs.san.oneFifthSanity': ' / ' + Math.ceil(actor.data.data.attribs.san.value / 5)
					});
				}
				break;
			}
		}
	}
}
