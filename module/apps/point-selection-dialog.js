export class PointSelectDialog extends Dialog {

	activateListeners(html) {
		super.activateListeners( html);

		html.find('.item-name').click( async (event) => this._onSelectCharacteristic( event));
		html.find('button').click( event => this._onButtonClicked( event));
	}

	async _onSelectCharacteristic( event){
		const li = event.currentTarget.closest('.item');
		const itemList=li.closest('.item-list');
		itemList.querySelectorAll('.selectable').forEach(item => {
			item.classList.remove('selected');
			this.data.data.characteristics[item.dataset.key].selected = false;
			this.data.data.characteristics[item.dataset.key].optional = false;
		});
		$(li).toggleClass('selected');
		this.data.data.characteristics[li.dataset.key].selected = true;
		const totalPoints = li.closest('#skill-selection-form').querySelector('.points');
		totalPoints.innerText = this.data.data.total + this.data.data.characteristics[li.dataset.key].multiplier*this.data.data.characteristics[li.dataset.key].value;
		const button = li.closest('#skill-selection-form').querySelector('button.validate');
		button.classList.remove('inactive');
		this.data.data.resolved = true;
		// const actor = game.actors.get( this.data.data.actorId);
		// await actor.addSkill( this.data.data.skills[Number(li.dataset.index)], this.data.data.type);
		// event.currentTarget.style.display = 'none';
		// if( !this.data.data.added) this.data.data.added = 0;
		// this.data.data.added++;
		// const form = event.currentTarget.closest('.point-selector');
		// const divCount = form.querySelector('.count');
		// divCount.innerText = this.data.data.added;
		// if( this.data.data.added >= this.data.data.options) this.close();
		// return event;
	}

	async _onButtonClicked( event){
		event.preventDefault();
		if( event.currentTarget.classList.contains('inactive')) return;
		super.close();
	}

	static async create( data){
		const html = await renderTemplate('systems/CoC7/templates/apps/point-select.html', data);
		return new Promise( resolve => {
			const dlg = new PointSelectDialog({
				title: data.title,
				content: html,
				data: data,
				buttons: {},
				close:  () => {
					if( data.resolved) return resolve(data);
					else return resolve(false);
				}
			}, {classes:[ 'coc7', 'dialogue', 'char-select']});
			dlg.render(true);
		});
	}
}