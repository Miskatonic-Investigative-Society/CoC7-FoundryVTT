import { CoC7Chat } from './chat.js';
import { CoC7Utilities } from './utilities.js';
import { CoC7ActorImporterDialog } from './apps/actor-importer-dialog.js';
import { CoC7LinkCreationDialog } from './apps/link-creation-dialog.js';

export class CoC7Menu {
	constructor( options){
		this.options = options;
		this.controls = this._getControls();
	}
	
	static async renderMenu( controls, html){
		// This could be made non static by moving the game.CoC7.menus initialization to getSceneControlButtons hook
		if( !game.CoC7.menus){
			game.CoC7.menus = new CoC7Menu();
			// ui.notifications.info( 'Menu init');
		}

		const menu = await renderTemplate( 'systems/CoC7/templates/coc7-menu.html', game.CoC7.menus.getData());
		const coc7Button = $(menu);
		
		coc7Button.find('.scene-control').click(game.CoC7.menus._onClickMenu.bind(game.CoC7.menus));
		coc7Button.find('.control-tool').click(game.CoC7.menus._onClickTool.bind(game.CoC7.menus));

		if( game.CoC7.menus.activeControl) html.find('.scene-control').removeClass('active');

		html.find('.scene-control').click( game.CoC7.menus._clearActive.bind(game.CoC7.menus));

		html.append( coc7Button);
		game.CoC7.menus.html = html;
	}

	get control(){
		if ( !this.controls ) return null;
		return this.controls.find(c => c.name === this.activeControl) || null;
	}

	_clearActive(event){
		event.preventDefault();
		const customMenuActive = !!this.activeControl;
		this.activeControl = '';
		const li = event.currentTarget;
		const controlName = li.dataset?.control;
		if( ui.controls.activeControl == controlName && customMenuActive){
			ui.controls.render();
		}
	}

	_onClickTool(event){
		event.preventDefault();
		if ( !canvas?.ready ) return;
		const li = event.currentTarget;
		const toolName = li.dataset.tool;
		const tool = this.control.tools.find(t => t.name === toolName);

		// ui.notifications.info( `found tool: ${tool.name}`);
	
		// Handle Toggles
		if ( tool.toggle ) {
			tool.active = !tool.active;
			if ( tool.onClick instanceof Function ) tool.onClick(tool.active);
		}
	
		// Handle Buttons
		else if ( tool.button ) {
			if ( tool.onClick instanceof Function ) tool.onClick(event);
		}
	
		// Handle Tools
		else {
			tool.activeTool = toolName;
			if ( tool.onClick instanceof Function ) tool.onClick();
		}
	}

	_onClickMenu(event){
		event.preventDefault();
		if ( !canvas?.ready ) return;
		const li = event.currentTarget;
		const controlName = li.dataset.control;
		const control = this.controls.find(t => t.name === controlName);

		if( control.button){
			if ( control.onClick instanceof Function ) control.onClick( event); //If control is a button, don't make it active.
			// ui.controls.render();
		} else {
			//If control is a menu and is not active.
			// html.find('.scene-control').removeClass('active'); // Deactivate other menu.
			// event.currentTarget.classList.add('active'); //Activate this menu.
			this.activeControl = controlName;//Set curstom active control to that control.
			ui.controls.render();
		} 
	}

	getData(){
		const isActive = !!canvas?.scene;

		// Filter to control tool sets which can be displayed
		let controls = this.controls.filter(s => s.visible !== false).map(s => {
			s = duplicate(s);

			// Add styling rules
			s.css = [
				'custom-control',
				s.button ? 'button' : null,
				isActive && (this.activeControl === s.name) ? 'active' : ''
			].filter(t => !!t).join(' ');

			// if( this.activeControl === s.name) ui.notifications.warn( `Active control: ${this.activeControl}`);

			if(s.button) return s;

			// Prepare contained tools
			s.tools = s.tools.filter(t => t.visible !== false).map(t => {
				let active = isActive && ((s.activeTool === t.name) || (t.toggle && t.active));
				t.css = [
					t.toggle ? 'toggle' : null,
					active ? 'active' : null,
					t.class ? t.class : null
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
			icon: 'game-icon game-icon-tentacle-strike',
			name: 'main-menu',
			title: 'CoC7.GmTools',
			visible: isGM,
			tools: [
				{
					toggle: true,
					icon : 'fas fa-angle-double-up',
					name: 'devphase',
					active: game.settings.get('CoC7', 'developmentEnabled'),
					title: 'CoC7.DevPhase',
					onClick :async () => await CoC7Utilities.toggleDevPhase()
				},
				{
					toggle: true,
					icon : 'fas fa-user-edit',
					name: 'charcreate',
					active: game.settings.get('CoC7', 'charCreationEnabled'), 
					title: 'CoC7.CharCreationMode',
					onClick :async () => await CoC7Utilities.toggleCharCreation()
				},
				{
					button: true,
					icon: 'fas fa-user-plus',
					name: 'actor-import',
					title: 'CoC7.ActorImporter',
					onClick : async () => await CoC7ActorImporterDialog.create({
						title: game.i18n.localize('CoC7.ActorImporter')
					})
				},
				{
					toggle: true,
					icon : 'fas fa-certificate',
					class: 'xp_toggle',
					name: 'xptoggle',
					active: game.settings.get('CoC7', 'xpEnabled'), 
					title: 'CoC7.toggleXP',
					onClick :async () => await CoC7Utilities.toggleXPGain()
				},
				{
					button: true,
					icon: 'game-icon game-icon-card-joker',
					name: 'fakeroll',
					title: 'CoC7.FakeRoll',
					onClick : CoC7Chat.fakeRollMessage
				},
				{
					button: true,
					icon: 'fas fa-moon',
					name: 'startrest',
					title: 'CoC7.startRest',
					onClick :async () => await CoC7Utilities.startRest()
				}
			]
		});

		controls.push({
			icon: 'game-icon game-icon-d10',
			name: 'dice-roll',
			title: 'CoC7.RollDice',
			button: true,
			onClick: (event) => CoC7Utilities.rollDice(event)
		});

		controls.push({
			icon: 'fas fa-link',
			name: 'create-link',
			title: 'CoC7.CreateLink',
			visible: isGM,
			button: true,
			onClick: CoC7LinkCreationDialog.create
		});
		return controls;
	}
}
