// import { RollDialog } from "./apps/roll-dialog";

export class CoC7Dice {

    // static async toMessage(result, speaker, flavor)
    // {
    //     //TODO demerder ce qui tient du check de ce qui tient du roll
    //     const templateData = {};
    //     templateData.dice = {
    //         tens : [],
    //         unit : {
    //             value: result.unit.total
    //         },
    //         total: result.total,
    //         tenResult: result.total - result.unit.total,
    //         hasBonus: result.bonusDice == 0 ? false : true,
    //         hasModifier: result.modifier == 0 ? false : true,
    //         bonus: Math.abs(result.bonusDice),
    //         bonusType: result.bonusDice < 0 ? "penalty" : "bonus",
    //         modifier: result.modifer,
    //         difficulty: result.difficulty
    //     };

    //     let max = (result.unit.total == 0)? 100 : 90;
    //     let min = (result.unit.total == 0)? 10 : 0;
    //     let highest = result.total - result.unit.total;
    
    //     for( let i = 0; i < result.tens.results.length; i++)
    //     {
    //         let die = {};
    //         die.value = result.tens.results[i];
    //         if( die.value == max) die.isMax = true; else die.isMax = false;
    //         if( die.value == min) die.isMin = true; else die.isMin = false;
    //         if( die.value == highest){ highest = 101; die.selected = true;}
    //         // if( die.value == 100) die.value = "00";
    //         templateData.dice.tens.push( die);
    //     }

    //     templateData.tenOnlyOneDie = templateData.dice.tens.length == 1;

    //     let required = result.target;

    //     switch( result.difficulty)
    //     {
    //         case "extreme":
    //             required = Math.floor( result.target / 5);
    //             break;
    //         case "hard":
    //             required = Math.floor( result.target / 2);
    //             break;
    //     }

    //     if( result.total <= result.target) templateData.resultType = "Regular success";
    //     if( result.total <= Math.floor(result.target / 2)) templateData.resultType = "Hard success";
    //     if( result.total <= Math.floor(result.target / 5)) templateData.resultType = "Extreme success";
    //     if( result.total > result.target) templateData.resultType = "Failure";

    //     templateData.isSuccess = required >= result.total ? true : false;
    //     if (result.total == 1) templateData.isSuccess = true;
    //     const fumble = result.target <= 50 ? 96 : 100;
    //     templateData.isFumble = result.total >= fumble;
    //     templateData.isCritical = result.total == 1;
    //     templateData.hasMalfunction = false;
    //     if( result.malfunction) {
    //         if( result.total >= result.malfunction) templateData.hasMalfunction = true;
    //     }
    //     templateData.difficulty = result.difficulty;



    //     const template = 'systems/CoC7/templates/chat/roll-result.html';
    //     const html = await renderTemplate(template, templateData);

    //     const test = await ChatMessage.create({
	// 		user: game.user._id,
    //         speaker: speaker,
    //         flavor: flavor,
	// 		content: html
    //     });

    //     AudioHelper.play({src: CONFIG.sounds.dice});
    //     return true;
    // }

    static roll( modif=0)
    {
        const normalSides = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
        const zeroSides = [100, 10, 20, 30, 40, 50, 60, 70, 80, 90];
        const unitDie = new Die(10);
        unitDie.sides = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const tenDie = new Die(10);
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

        let total;
        if( modif < 0)
        {
            total = Math.max( ...tenDie.results);
        }
        else
        {
            total = Math.min( ...tenDie.results);
        }


        if( game.dice3d){
            const diceResults = [];
            tenDie.results.forEach(dieResult => { 
                diceResults.push( 100 == dieResult ?0:dieResult/10);
            });
            diceResults.push( unitDie.total);

            const diceData = {
                formula: `${tenDie.results.length}d100+1d10`,
                results: diceResults,
                whisper: null,
                blind: false
            };
    
            game.dice3d.show(diceData);
        }

        total = total + unitDie.total;
        let result = {};
        result.unit = unitDie;
        result.tens = tenDie;
        result.total = total;
 

        return result;
    }
}