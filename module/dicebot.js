/**
 *CallofCthulhu(7thEd.) Define your own commands
 *Here, we receive the chat Messages and determine each command.
 *[/CC]Define a command to judge a normal dice.
 *[/CBR] Command to define the decision on combination rolls.
*/
Hooks.on("chatMessage", (html,content) => {
//Read the command
    let rgx;
    rgx = /(\S+)/g;
    let commands = content.match(rgx);
    let command = commands[0];

//Declare the dice to be used.
    //Define a function to read the value
    let m = 0;
    let n = 0;
    let s = 0;


    //Define errors as debugging.
    let res = "<h1>Error</h1>";
    
    //Normal Dice
    let r = new Roll("1d100");

   //Perform processing for each command.
   if(command === "/CC" || command === "/cc"){
    //This time, extract only the numbers.
    rgx = /(?:[0-9]+)/g;   
    commands = content.match(rgx);
    m = commands[0];

    //Determination based on rolls and readings
    r.roll();
    //Put the result of the die into s as a number rather than an object.
    s = r.result;
    if(s <= 1) res = game.i18n.localize("CoC7.CriticalSuccess");
    else if(s >= 100) res= game.i18n.localize("CoC7.Fumble");
    else if(s <= (m/5)) res= game.i18n.localize("CoC7.ExtremeSuccess");
    else if(s <= (m/2)) res= game.i18n.localize("CoC7.HardSuccess");
    else if(s <= m) res= game.i18n.localize("CoC7.RegularSuccess");
    else if(s >= 96){if(m < 50) res= game.i18n.localize("CoC7.Fumble"); 
    else res= game.i18n.localize("CoC7.Failure");}
    else res= game.i18n.localize("CoC7.Failure");

    //The resulting output.
    res += (game.i18n.localize("CoC7.SkillValue") + m);
    r.toMessage(
        {speaker: ChatMessage.getSpeaker(),
        flavor: res,
        });
    //return to avoid errors in the command.
        return false;
    }


    //I'm currently using it for testing bonus dice.
    if(command === "/CBR" || command === "/cbr"){
        //Extracting numbers from combination rolls
        rgx = /(?:[0-9]+)/g;   
        commands = content.match(rgx);
        m = commands[0];
        rgx = /(?:,[0-9]+)/g;   
        commands = content.match(rgx);
        n = commands[0].replace(/[^0-9]/g, '');
        
        //Determination based on rolls and readings
        r.roll();
        //Put the result of the die into s as a number rather than an object.
        s = r.result;
        //Determine the first number.
        if(s <= 1) res = game.i18n.localize("CoC7.CriticalSuccess");
        else if(s >= 100) res= game.i18n.localize("CoC7.Fumble");
        else if(s <= (m/5)) res= game.i18n.localize("CoC7.ExtremeSuccess");
        else if(s <= (m/2)) res= game.i18n.localize("CoC7.HardSuccess");
        else if(s <= m) res= game.i18n.localize("CoC7.RegularSuccess");
        else if(s >= 96){if(m < 50) res= game.i18n.localize("CoC7.Fumble"); 
        else res= game.i18n.localize("CoC7.Failure");}
        else res= game.i18n.localize("CoC7.Failure");
        //Record the first results.
        res += (game.i18n.localize("CoC7.SkillValue") + m);

        //Determine the second number.
        if(s <= 1) res += game.i18n.localize("CoC7.CriticalSuccess");
        else if(s >= 100) res += game.i18n.localize("CoC7.Fumble");
        else if(s <= (n/5)) res += game.i18n.localize("CoC7.ExtremeSuccess");
        else if(s <= (n/2)) res += game.i18n.localize("CoC7.HardSuccess");
        else if(s <= n) res += game.i18n.localize("CoC7.RegularSuccess");
        else if(s >= 96){if(n < 50) res += game.i18n.localize("CoC7.Fumble"); 
        else res += game.i18n.localize("CoC7.Failure");}
        else res += game.i18n.localize("CoC7.Failure");
        //The resulting output.
        res += (game.i18n.localize("CoC7.SkillValue") + n);
        r.toMessage(
            {speaker: ChatMessage.getSpeaker(),
            flavor: res,
            });
        //return to avoid errors in the command.
            return false;
        }
    })
