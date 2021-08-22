REFACTORING:
(1)
new-success-level/newSuccessLevel
luck-amount/luckAmount are redundant. Needs to eliminate one.

(2)
Crosscheck that token sometimes don't have a scene = game.actors.token['id']
Duplicate methods in helper.js and chat.js: - CoC7Chat.\_getChatCardActor - CoC7Chat.\_getActorFromKey - CoC7Chat.getToken - CoC7Chat.getActorFromToken - chatHelper.getActorFromKey - chatHelper.getTokenFromKey

    Other to check :
    - check.js
    	set actor(x)
    - actor.js
    	get tokenKey()
    	get actorKey()
    	CoC7Actor.getActorFromKey
    - item.js
    	CoC7Item._getChatCardActor
