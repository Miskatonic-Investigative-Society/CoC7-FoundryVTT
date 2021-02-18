export class OpposedCheckCard{
	static dispatch( data){
		ui.notifications.info('pouet pouet');
		if( game.user.isGM){
			ui.notifications.info(`Dipatched ! ${data.tokenKey}`);
		}
	}
}