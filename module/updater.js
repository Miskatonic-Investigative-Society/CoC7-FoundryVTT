export class Updater {
	static async checkForUpdate() {
		let systemUpdateVersion = game.settings.get('CoC7', 'systemUpdateVersion');
		if (isNewerVersion('0.2', systemUpdateVersion)) {
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
		for (let actor of game.actors.contents) {
			await Updater.updateActor(systemUpdateVersion, actor);
		}
		game.settings.set('CoC7', 'systemUpdateVersion', '0.2');
	}

	static async updateActor (systemUpdateVersion, actor) {
		if ('character' === actor.data.type) {
			for (let item of actor.items) {
				switch (systemUpdateVersion) {
				case '0.0':
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
			const defaults = {};
			const oneFifthSanity = Math.ceil(actor.data.data.attribs.san.value / 5);
			switch (systemUpdateVersion) {
			case '0.1':
				if (typeof actor.data.data.attribs.san.dailyLoss === 'undefined' || actor.data.data.attribs.san.dailyLoss === null) {
					defaults['data.attribs.san.dailyLoss'] = 0;
				}
				if (typeof actor.data.data.attribs.san.oneFifthSanity === 'undefined' || actor.data.data.attribs.san.oneFifthSanity === null) {
					defaults['data.attribs.san.oneFifthSanity'] = ' / ' + oneFifthSanity;
				}
				if (typeof actor.data.data.indefiniteInsanityLevel === 'undefined' || actor.data.data.indefiniteInsanityLevel === null || typeof actor.data.data.indefiniteInsanityLevel.value === 'undefined' || actor.data.data.indefiniteInsanityLevel.value === null) {
					defaults['data.indefiniteInsanityLevel.value'] = 0;
				}
				if (typeof actor.data.data.indefiniteInsanityLevel === 'undefined' || actor.data.data.indefiniteInsanityLevel === null || typeof actor.data.data.indefiniteInsanityLevel.max === 'undefined' || actor.data.data.indefiniteInsanityLevel.max === null) {
					defaults['data.indefiniteInsanityLevel.max'] = oneFifthSanity;
				}
				if (typeof actor.data.data.attribs.mp.value === 'undefined' || actor.data.data.attribs.mp.value === null) {
					defaults['data.attribs.mp.value'] = oneFifthSanity;
				}
				if (typeof actor.data.data.attribs.mp.max === 'undefined' || actor.data.data.attribs.mp.max === null) {
					defaults['data.attribs.mp.max'] = oneFifthSanity;
				}
				if (typeof actor.data.data.notes === 'undefined' || actor.data.data.notes === null) {
					defaults['data.notes'] = '';
				}
				if (Object.keys(defaults).length > 0) {
					await actor.update(defaults);
				}
				break;
			}
		}
	}
}
