[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/staebchenfisch)

# socketlib
A library for simplifying working with foundries sockets. This module does not have any user facing features. You only need to install it if one of the modules you use lists it as a dependency.

This library makes it easy to execute functions in the clients of other connected users. Parameters can be passed to the remote functions as easy as they can be passed to regular functions and it's possible to retrieve the return value of the remote function via `await`. The features of socketlib are:
- **Execute a function as GM**: socketlib allows you to execute a function as a gm user. If a GM client is connected, that client will execute that function. The original client can wait for the GM to finish the execution of the function and retrieve the return value of the function via `await`. If multiple GMs are connected, socketlib will make sure only one of the GMs will execute the function.
- **Execute a function as another user**: socketlib allows you to execute a function in the client of another user. The original client can wait for the other user to finish execution of the function and retrieve the return value the function via `await`.
- **Execute a function for all users**: socketlib will execute a function in the clients of all other connected users.
- **Execute a function for all GMs**: socketlib will execute a function in the clients of all connected GMs.
- **Execute a function for a specified list of players**: socketlib will execute a function in the clients of several players that can be identified by their id.

## API
Below is a small example code that demonstrates the usage of socketlib. All of socketlibs functions are accessible via `socketlib.`. Documentation for each of the available functions can be found blow the example code.

### Example Code

```javascript
let socket;

Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerModule("my-module");
	socket.register("hello", showHelloMessage);
	socket.register("add", add);
});

Hooks.once("ready", async () => {
	// Let's send a greeting to all other connected users.
	// Functions can either be called by their given name...
	socket.executeForEveryone("hello", game.user.name);
	// ...or by passing in the function that you'd like to call.
	socket.executeForEveryone(showHelloMessage, game.user.name);
	// The following function will be executed on a GM client.
	// The return value will be sent back to us.
	const result = await socket.executeAsGM("add", 5, 3);
	console.log(`The GM client calculated: ${result}`);
});

function showHelloMessage(userName) {
	console.log(`User ${userName} says hello!`);
}

function add(a, b) {
	console.log("The addition is performed on a GM client.");
	return a + b;
}
```

The example code registers the hook `socketlib.ready` this hook is fired once socketlib has initialized and is ready to do it's job. The module registers itself with socketlib. This causes socketlib to start listening for socket messages coming in for the registered module. In addition the registration returns a socket that will be used for all further interactions with socketlib.

To be able to call a function via socketlib, that function has to be registered in the socket on all clients and must be given a unique name. Since a function can only be called via socketlib if it has been registered on both the calling client and the executing client it's advisable to register all the relevant functions immediately after you've registered your module in socketlib.

Once foundry is loaded up, the example code sends a hello message to all connected users. For illustrative purposes this is done twice, once by passing in the name given to the function during registration and once by passing in the function that should be called on the other clients. Both ways work. Afterwards the function `add` will be invoked on the client of *one* of the connected GMs. The add function will print a message into the log, which allows you to verify that the function is indeed being executed on the GMs client. The GM will perform the calculation and result, which will be sent back to the original client, which will write the result into it's own log.

### Function documentation
#### socketlib.registerModule
```javascript
socketlib.registerModule(moduleName);
```

Call `registerModule` to make socketlib listen for sockets that come in for your module. This is the first function in socketlib that your module should call.

- **moduleName** is the name of your module as specificed in your modules's manifest.

**Return value**: A socket instance is returned, that is used for all further interactions with socketlib.

#### socketlib.registerSystem
```javascript
registerSystem(systemId);
```

Call `registerSystem` to make socketlib listen for sockets that come in for your game system. This is the first function in socketlib that your game system should call.

- **systemId** the id of your game system as specified in your game system's manifest.

**Return value**: A socket instance is returned, that is used for all further interactions with socketlib.

#### socket.register
```javascript
socket.register(name, func);
```

Registers a function that can subsequently be called using socketlib. It's important that the registration of a function is done on all connected clients before the function is being called via socketlib. Otherwise the call won't succeed. For this reason it's recommended to register all relevant functions during the `socketlib.ready` hook, immediatly after `socketlib.registerModule` has been called.

- **name** is a name that is used to identify the function within socketlib. This name can be used to call the function later. This name must be unique among all names your module registers within socketlib.
- **func** is the function that's being registered within socketlib.

**Return value**: This function has no return value.

#### socket.executeAsGM
```javascript
async socket.executeAsGM(handler, parameters...);
```

Executes a function on the client of exactly one GM. If multiple GMs are connected, one of the GMs will be selected to execute the function. This function will fail if there is no GM connected. The function must have been registered using [`socket.register`](#socketregister) before it can be invoked via this function.

- **handler** can either be the function that should be executed or the name given to that function during registration.
- **parameters...** the parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.

**Return value**: The promise that this function returns will resolve once the GM has finished the execution of the invoked function and will yield the return value of that function. If the execution on the GM client fails for some reason, this function will fail with an appropriate Error as well.

#### socket.executeAsUser
```javascript
async socket.executeAsUser(handler, userId, parameters...);
```

Executes a function on the client of the specified user. This function will fail if the specified user is not connected. The function must have been registered using [`socket.register`](#socketregister) before it can be invoked via this function.

- **handler** can either be the function that should be executed or the name given to that function during registration.
- **userId** the id of the user that should execute this function.
- **parameters...** the parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.

**Return value**: The promise that this function returns will resolve once the user has finished the execution of the invoked function and will yield the return value of that function. If the execution on other user's client fails for some reason, this function will fail with an appropriate Error as well.

#### socket.executeForAllGMs
```javascript
async socket.executeForAllGMs(handler, parameters...);
```

Executes a function on the clients of all connected GMs. If the current user is a GM the function will be executed locally as well. The function must have been registered using [`socket.register`](#socketregister) before it can be invoked via this function.

- **handler** can either be the function that should be executed or the name given to that function during registration.
- **parameters...** the parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.

**Return value**: The promise returned by this function will resolve as soon as the request for execution has been sent to the connected GM clients and *will not* wait until those clients have finished processing that function. The promise will not yield any return value.

#### socket.executeForOtherGMs
```javascript
async socket.executeForOtherGMs(handler, parameters...);
```

Executes a function on the clients of all connected GMs, except for the current user. If the current user is not a GM this function has the same behavior as [`socket.executeForAllGMs`](#socketexecuteasgm). The function must have been registered using [`socket.register`](#socketregister) before it can be invoked via this function.

- **handler** can either be the function that should be executed or the name given to that function during registration.
- **parameters...** the parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.

**Return value**: The promise returned by this function will resolve as soon as the request for execution has been sent to the connected GM clients and *will not* wait until those clients have finished processing that function. The promise will not yield any return value.

#### socket.executeForEveryone
```javascript
async socket.executeForEveryone(handler, ...args);
```

Executes a function on all connected clients, including on the local client. The function must have been registered using [`socket.register`](#socketregister) before it can be invoked via this function.

- **handler** can either be the function that should be executed or the name given to that function during registration.
- **parameters...** the parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.

**Return value**: The promise returned by this function will resolve as soon as the request for execution has been sent to the connected clients and *will not* wait until those clients have finished processing that function. The promise will not yield any return value.

#### socket.executeForOthers
```javascript
async socket.executeForOthers(handler, ...args);
```

Executes a function on all connected clients, but not locally. The function must have been registered using [`socket.register`](#socketregister) before it can be invoked via this function.

- **handler** can either be the function that should be executed or the name given to that function during registration.
- **parameters...** the parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.

**Return value**: The promise returned by this function will resolve as soon as the request for execution has been sent to the connected clients and *will not* wait until those clients have finished processing that function. The promise will not yield any return value.

#### socket.executeForUsers
```javascript
async executeForUsers(handler, recipients, ...args);
```

Executes a function on the clients of a specified list of players. The function must have been registered using [`socket.register`](#socketregister) before it can be invoked via this function.

- **handler** can either be the function that should be executed or the name given to that function during registration.
- **recipients** an array of user ids that should execute the function.
- **parameters...** the parameters that should be passed to the called function. Pass the parameters in comma separated, as you would do for a regular function call.

**Return value**: The promise returned by this function will resolve as soon as the request for execution has been sent to the specified clients and *will not* wait until those clients have finished processing that function. The promise will not yield any return value.
