export class CoC7Dice {

	static roll( modif=0, rollMode=null, hideDice = false)
	{
		let unitDie;
		let tenDie;
		let total;
		const is7 = Object.prototype.hasOwnProperty.call(Roll, 'cleanTerms');
		if( is7){
			unitDie = {
				total: 0,
				results: []
			};
			tenDie = {
				total: 0,
				results: []
			};
			const unit = new DiceTerm({faces:10});
			unit.evaluate();
			const tens = new DiceTerm({number: Math.abs(modif)+1, faces:10});
			unit.results.forEach( r => {
				if( 10 === r.result){
					r.result = 0;
				}
				unitDie.results.push( r.result);
			});
			unitDie.total = unit.total;
			tens.evaluate();
			tens.results.forEach( r => {
				if( 0 != unit.total && 10 === r.result){
					r.result = 0;
				}
				r.result = r.result * 10;
				tenDie.results.push( r.result);
			});

			if( modif < 0){
				total = Math.max( ...tens.values);
			} else
			{
				total = Math.min( ...tens.values);
			}
			tenDie.total = total;
		} else {
			const normalSides = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
			const zeroSides = [100, 10, 20, 30, 40, 50, 60, 70, 80, 90];
			unitDie = new Die(10);
			unitDie.sides = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
			tenDie = new Die(10);
			modif = parseInt( modif);
			unitDie.roll(1);
			if( unitDie.total == 0)
			{
				tenDie.sides = zeroSides;
			}
			else
			{
				tenDie.sides = normalSides;
			}   
        
			if( modif == 0 )
			{
				tenDie.roll(1);
			}
			else
			{
				tenDie.roll( 1 + Math.abs(modif));
			}

			if( modif < 0)
			{
				total = Math.max( ...tenDie.results);
			}
			else
			{
				total = Math.min( ...tenDie.results);
			}
		}


		const isBlind = 'blindroll' === (rollMode? rollMode: game.settings.get('core', 'rollMode'));
		const isPrivateGM = 'gmroll' === (rollMode? rollMode: game.settings.get('core', 'rollMode'));

		if( !isBlind && !hideDice){
			if( game.modules.get('dice-so-nice')?.active){
				
				const [version] = game.modules.get('dice-so-nice')?.data.version.split('.');
				const DsN3 = Number(version) >= 3 /*&& game.settings.get('CoC7', 'overrideDsNStyle')*/;
				const syncDice = game.settings.get('CoC7', 'syncDice3d');
				const unitDieColorset = DsN3? game.settings.get('CoC7', 'unitDieColorset'): null;
				const tenDieNoMod = DsN3? game.settings.get('CoC7', 'tenDieNoMod'): null;
				const tenDieBonus = DsN3? game.settings.get('CoC7', 'tenDieBonus'): null;
				const tenDiePenalty = DsN3? game.settings.get('CoC7', 'tenDiePenalty'): null;
				
				const diceResults = [];
				tenDie.results.forEach(dieResult => { 
					diceResults.push( 100 == dieResult ?0:dieResult/10);
				});
				diceResults.push( unitDie.total);

				const diceData = {
					formula: `${tenDie.results.length}d100+1d10`,
					results: diceResults,
					throws: [{
						dice:[]
					}],
					whisper: null,
					blind: false
				};

				tenDie.results.forEach( dieResult => {
					diceData.throws[0].dice.push({
						result:100 == dieResult ?0:dieResult/10,
						resultLabel:100 == dieResult ?0:dieResult/10,
						type: 'd100',
						vectors:[],
						options:{
							colorset: !modif? tenDieNoMod : 0 > modif? tenDiePenalty: tenDieBonus
						}
					});
				});//acid (vert), necrotic (red), inspired (white), bloodmoon (red), Foundry, toxic (green), bronze, white

				diceData.throws[0].dice.push({
					result:unitDie.total,
					resultLabel:unitDie.total,
					type: 'd10',
					vectors:[],
					options:{
						colorset: unitDieColorset
					}
				});
	
				try{
					const users = isPrivateGM||isBlind?game.users.filter( u => {
						if(u.isGM) return true;
						return false;
					}):null;
					game.dice3d.show(diceData, game.user, syncDice, users, isBlind);
				} catch(err){
					console.error('Roll: ' + err.message);
				}
			}
		}

		total = total + unitDie.total;
		let result = {};
		result.unit = unitDie;
		result.tens = tenDie;
		result.total = total;
 
		//CHEAT :
		// result.unit= { total:7, results:[7]};
		// result.tens= { total:9, results:[9]};
		// result.total= 97;
		return result;
	}

	static async showRollDice3d(roll)
	{

		if(game.modules.get('dice-so-nice')?.active)
		{
			const syncDice = game.settings.get('CoC7', 'syncDice3d');

			await game.dice3d.showForRoll(roll,game.user,syncDice);
		}
	}
  
}