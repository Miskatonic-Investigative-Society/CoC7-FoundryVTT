export class CharacRollDialog extends Dialog {

	activateListeners(html) {
		super.activateListeners( html);
		html.on('change', 'input', this._onChangeInput.bind(this));
		html.on('submit', 'form', this._onSubmit.bind(this));
		html.on('click', '.roll-characteristic', this._onRollCharacteristic.bind(this));
		html.on('click', 'button', this._onButton.bind(this));
	}
    
	async _onRollCharacteristic( event){
		event.preventDefault();
		const li = event.currentTarget.closest('.item');
		const characKey = li.dataset.key;
		this.rollCharacteristic( characKey);
	}
    
	async _onButton( event){
		const action = event.currentTarget.dataset.action;
		if( 'roll' == action){
			['str', 'con', 'siz' ,'dex' ,'app' ,'int' ,'pow', 'edu', 'luck'].forEach(char => {
				this.rollCharacteristic( char);
			});
		}
		if( 'validate' == action && !event.currentTarget.classList.contains('inactive')) this.close();
	}
    
	async rollCharacteristic( key){
		const li = this._element[0].querySelector(`li.item[data-key=${key}]`);
		const input = li?.querySelector('input');
		const formula = this.data.data.characteristics.rolls[key];
		if( input && formula){
			if( isNaN(Number(formula))){
				const roll = new Roll( formula);
				roll.roll();
				roll.toMessage({flavor: `Rolling characterisitic ${this.data.data.characteristics.list[key].label}: ${formula}`});
				input.value = roll.total;
			} else input.value = Number(formula);
			this.data.data.characteristics.values[key] = Number(input.value);
			if( !this.rolled) this.rolled={};
			this.rolled[key]=true;
		}
		this.checkTotal();
	}
    
	async _onChangeInput( event){
		event.preventDefault();
		const input = event.currentTarget;
		const value = Number( input.value);
		if( !isNaN(value)){
			this.data.data.characteristics.values[input.name] = value;
		}

		this.checkTotal();
	}
    
	checkTotal(){
		this.data.data.characteristics.points.total = 0;
		for (const [key , value] of Object.entries(this.data.data.characteristics.values)) {
			if( 'luck' != key)
				this.data.data.characteristics.points.total += value;
		}

		const validation = this._element[0].querySelector( '.points');
		if( this.data.data.characteristics.points.enabled){
			if( this.data.data.characteristics.points.total != this.data.data.characteristics.points.value) validation.classList.add('warning');
			else {
				validation.classList.remove('warning');
				const validateButton = this._element[0].querySelector( 'button.validate');
				validateButton.classList.remove('inactive');
				this.data.data.validate = true;
			}
			const value = validation.querySelector( '.value');
			value.innerText = this.data.data.characteristics.points.value;
		}

		const total = validation.querySelector( '.total');
		total.innerText = this.data.data.characteristics.points.total;
        
		if( this.data.data.characteristics.rolls.enabled){
			if( this.rolled){
				this.data.data.validate = !Object.entries(this.rolled).find( el => !el) && 9 == Object.entries(this.rolled).length;
				if( this.data.data.validate){
					const validateButton = this._element[0].querySelector( 'button.validate');
					validateButton.classList.remove('inactive');
				}
			}
		}

	}
    
	async _onSubmit( event){
		event.preventDefault();
	}

	static async create( data){ 
		data.characteristics.points.total = 0;
		for (const [key , value] of Object.entries(data.characteristics.values)) {
			if( 'luck' != key)
				data.characteristics.points.total += value || 0;
		}

		if( data.characteristics.points.enabled)
			if( data.characteristics.points.total != data.characteristics.points.value ) data.pointsWarning = true;

		const html = await renderTemplate('systems/CoC7/templates/apps/char-roll.html', data);
		return new Promise( resolve => {
			const dlg = new CharacRollDialog({
				title: data.title,
				content: html,
				data: data,
				buttons: {},
				close:  () => {
					if( data.validate) return resolve(true);
					else return resolve(false);
				}
			}, {classes:[ 'coc7', 'dialogue', 'char-select']});
			dlg.render(true);
		});
	}
}