export class CharacSelectDialog extends Dialog {

	activateListeners(html) {
		super.activateListeners( html);

		html.find('.item-name').click( async (event) => this._onSelectCharacteristic( event));
	}

	async _onSelectCharacteristic( event){
		const li = event.currentTarget.closest('.item');
		this.data.data.selected = li.dataset.key;
		this.close();
	}

	static async create( data){
		const html = await renderTemplate('systems/CoC7/templates/apps/char-select.html', data);
		return new Promise( resolve => {
			const dlg = new CharacSelectDialog({
				title: data.title,
				content: html,
				data: data,
				buttons: {},
				close:  () => {
					if( data.selected) return resolve(data.selected);
					else return resolve(false);
				}
			}, {classes:[ 'coc7', 'dialogue', 'char-select']});
			dlg.render(true);
		});
	}
}