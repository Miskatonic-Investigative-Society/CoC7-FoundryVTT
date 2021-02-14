import { CoC7Utilities } from './utilities.js';

export class CoC7Menu {
	constructor( options){
		this.options = options;
		this.controls = this._getControls();
	}
	
	static async renderMenu( controls, html){

		if( !game.CoC7.menus){
			game.CoC7.menus = new CoC7Menu();
			ui.notifications.info( 'Menu init');
		}

		const menu = await renderTemplate( 'systems/CoC7/templates/coc7-menu.html', game.CoC7.menus.getData());

		const coc7Button = $(menu);
		
		coc7Button.find('.scene-control').click( async ev => game.CoC7.menus._onClickMenu(ev, html));
		coc7Button.find('.control-tool').click(game.CoC7.menus._onClickTool.bind(this));

		if( game.CoC7.menus.activeControl) html.find('.scene-control').removeClass('active');

		html.find('.scene-control').click( game.CoC7.menus._clearActive.bind(this));

		html.append( coc7Button);
	}

	_clearActive(){
		game.CoC7.menus.activeControl = '';
		ui.controls.render();
	}

	_onClickTool(event){
		event.preventDefault();
		if ( !canvas?.ready ) return;
		const li = event.currentTarget;
		const toolName = li.dataset.tool;
		const tool = this.tools.find(t => t.name === toolName);

		ui.notifications.info( `found tool: ${tool.name}`);
	
		// Handle Toggles
		if ( tool.toggle ) {
			tool.active = !tool.active;
			if ( tool.onClick instanceof Function ) tool.onClick(tool.active);
		}
	
		// Handle Buttons
		else if ( tool.button ) {
			if ( tool.onClick instanceof Function ) tool.onClick();
		}
	
		// Handle Tools
		else {
			control.activeTool = toolName;
			if ( tool.onClick instanceof Function ) tool.onClick();
		}
	}

	_onClickMenu(event, html){
		event.preventDefault();
		if ( !canvas?.ready ) return;
		const li = event.currentTarget;
		const controlName = li.dataset.control;
		const control = this.controls.find(t => t.name === controlName);

		if( control.button){
			if ( control.onClick instanceof Function ) control.onClick();
			// ui.controls.render();
		} else if( !event.currentTarget.classList.contains('active')){
			// await canvas.getLayer('TokenLayer').activate(); // Activate token layer
			html.find('.scene-control').removeClass('active'); // Deactivate other menu
			event.currentTarget.classList.add('active'); //Activate this menu
			this.activeControl = controlName;
		} else {
			this.activeControl = '';
			ui.controls.render();
		}
	}

	getData(){
		const isActive = !!canvas?.scene;

		// Filter to control tool sets which can be displayed
		let controls = this.controls.filter(s => s.visible !== false).map(s => {
			s = duplicate(s);

			if(s.button) return s;

			// Add styling rules
			s.css = isActive && (this.activeControl === s.name) ? 'active' : '';

			// Prepare contained tools
			s.tools = s.tools.filter(t => t.visible !== false).map(t => {
				let active = isActive && ((s.activeTool === t.name) || (t.toggle && t.active));
				t.css = [
					t.toggle ? 'toggle' : null,
					active ? 'active' : null
				].filter(t => !!t).join(' ');
				return t;
			});
			return s;
		});

		// Return data for rendering
		return {
			active: isActive,
			cssClass: isActive ? '' : 'disabled',
			controls: controls//.filter(s => s.tools.length)
		};
	}

	_getControls(){
		const isGM = game.user.isGM;
		const controls = [];
		controls.push({
			css: 'coc7-menu',
			icon: 'game-icon game-icon-tentacle-strike',
			name: 'main-menu',
			title: 'Title',
			tools: [
				{
					toggle: true,
					icon : 'fas fas fa-user-edit',
					name: 'charcreate',
					active: game.settings.get('CoC7', 'charCreationEnabled'), 
					title: game.settings.get('CoC7', 'charCreationEnabled')? game.i18n.localize( 'CoC7.CharCreationEnabled'): game.i18n.localize( 'CoC7.CharCreationDisabled'),
					onClick :async () => await CoC7Utilities.toggleCharCreation()}
			]
		});

		controls.push({
			css: 'coc7-menu',
			icon: 'game-icon game-icon-d10',
			name: 'check',
			title: 'Title',
			button: true,
			onClick: async () => await CoC7Utilities.toggleCharCreation()
		});

		controls.push({
			css: 'coc7-menu',
			icon: 'game-icon game-icon-tentacurl',
			name: 'CoC7 Menu 2',
			title: 'Title',
			tools: [
				{
					toggle: true,
					name: 'clear',
					title: 'CONTROLS.MeasureClear',
					icon: 'fas fa-trash',
					visible: isGM,
					onClick: () => canvas.templates.deleteAll(),
					button: true
				},
				{
					name: 'clear',
					title: 'CONTROLS.MeasureClear',
					icon: 'fas fa-trash',
					visible: isGM,
					onClick: () => canvas.templates.deleteAll(),
					button: true
				},
				{
					name: 'clear',
					title: 'CONTROLS.MeasureClear',
					icon: 'fas fa-trash',
					visible: isGM,
					onClick: () => canvas.templates.deleteAll(),
				}
			]
		});

		return controls;
	}
}
