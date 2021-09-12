## 1.0.9
### Compatibility
- Verified compatibility with Foundry 0.8.9


## 1.0.8
### Compatibility
- Verified compatibility with Foundry 0.8.8


## 1.0.7
### Compatibility
- Verified compatibility with Foundry 0.8.7


## 1.0.6
### Compatibility
- Verified compatibility with Foundry 0.8.5


## 1.0.5
### Compatibility
- Add support for Foundry 0.8.2


## 1.0.4
### New features
- The `this` value of functions now contains the id of the user that triggered the function execution.
- Some network packets are now more efficient.

### Bugfixes
- When an invalid user id is specified socketlib will now throw the correct error message.
- When a player disconnects the moment an execution has been scheduled for their client the execution function will now throw an exception, as it would if the player hadn't been connected in the first place. Previously the execution would just silently fail and the promise never resolve in such cases.


## 1.0.3
### Bugfixes
- `executeFor` functions will no longer fail with an exception if a function scheduled to be called by the local user throws.


## 1.0.2
### New API endpoints
- Added `executeForOthers` and `executeForOtherGMs` that execute for all users/all GMs except the local client.

### Bugfixes
- `executeAsUser` and `executeForUsers` didn't execute locally if the id of the current user was passed in as recipient.
- `executeForEveryone` and `executeForAllGMs` now execute locally as well, as they should


## 1.0.1
### New features
- Added support for game systems

### Compatibility
- Add support for Foundry 0.8.1


## 1.0.0
### Initial release
