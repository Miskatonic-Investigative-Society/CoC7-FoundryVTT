import {libWrapper} from "./libwrapper_shim.js";
import * as errors from "./errors.js";

const RECIPIENT_TYPES = {
	ONE_GM: 0,
	ALL_GMS: 1,
	EVERYONE: 2,
}

const MESSAGE_TYPES = {
	COMMAND: 0,
	REQUEST: 1,
	RESPONSE: 2,
	RESULT: 3,
	EXCEPTION: 4,
	UNREGISTERED: 5,
}

Hooks.once("init", () => {
  // Adding a check so will fallback to module if installed
  if (typeof window.socketlib === 'undefined') {
    window.socketlib = new Socketlib();
  	Hooks.callAll("socketlib.ready");
  }
}, "WRAPPER");

class Socketlib {
	constructor() {
		this.modules = new Map();
		this.system = undefined;
		this.errors = errors;
	}

	registerModule(moduleName) {
		const existingSocket = this.modules.get(moduleName);
		if (existingSocket)
			return existingSocket;
		const module = game.modules.get(moduleName);
		if (!module?.active) {
			console.error(`socketlib | Someone tried to register module '${moduleName}', but no module with that name is active. As a result the registration request has been ignored.`);
			return undefined;
		}
		if (!module.socket) {
			console.error(`socketlib | Failed to register socket for module '${moduleName}'. Please set '"socket":true' in your manifset and restart foundry (you need to reload your world - simply reloading your browser won't do).`);
			return undefined;
		}
		const newSocket = new SocketlibSocket(moduleName, "module");
		this.modules.set(moduleName, newSocket);
		return newSocket;
	}

	registerSystem(systemId) {
		if (game.system.id !== systemId) {
			console.error(`socketlib | Someone tried to register system '${systemId}', but that system isn't active. As a result the registration request has been ignored.`);
			return undefined;
		}
		const existingSocket = this.system;
		if (existingSocket)
			return existingSocket;
		if (!game.system.socket) {
			console.error(`socketlib | Failed to register socket for system '${systemId}'. Please set '"socket":true' in your manifest and restart foundry (you need to reload your world - simply reloading your browser won't do).`);
		}
		const newSocket = new SocketlibSocket(systemId, "system");
		this.system = newSocket;
		return newSocket;
	}
}

class SocketlibSocket {
	constructor(moduleName, moduleType) {
		this.functions = new Map();
		this.socketName = `${moduleType}.${moduleName}`;
		this.pendingRequests = new Map();
		game.socket.on(this.socketName, this._onSocketReceived.bind(this));
	}

	register(name, func) {
		if (!(func instanceof Function)) {
			console.error(`socketlib | Cannot register non-function as socket handler for '${name}' for '${this.socketName}'.`);
			return;
		}
		if (this.functions.has(name)) {
			console.warn(`socketlib | Function '${name}' is already registered for '${this.socketName}'. Ignoring registration request.`);
			return;
		}
		this.functions.set(name, func);
	}

	async executeAsGM(handler, ...args) {
		const [name, func] = this._resolveFunction(handler);
		if (game.user.isGM) {
			return this._executeLocal(func, ...args);
		}
		else {
			if (!game.users.find(isActiveGM)) {
				throw new errors.SocketlibNoGMConnectedError(`Could not execute handler '${name}' (${func.name}) as GM, because no GM is connected.`);
			}
			return this._sendRequest(name, args, RECIPIENT_TYPES.ONE_GM);
		}
	}

	async executeAsUser(handler, userId, ...args) {
		const [name, func] = this._resolveFunction(handler);
		if (userId === game.userId)
			return this._executeLocal(func, ...args);
		const user = game.users.get(userId);
		if (!user)
			throw new errors.SocketlibInvalidUserError(`No user with id '${userId}' exists.`);
		if (!user.active)
			throw new errors.SocketlibInvalidUserError(`User '${user.name}' (${userId}) is not connected.`);
		return this._sendRequest(name, args, [userId]);
	}

	async executeForAllGMs(handler, ...args) {
		const [name, func] = this._resolveFunction(handler);
		this._sendCommand(name, args, RECIPIENT_TYPES.ALL_GMS);
		if (game.user.isGM) {
			try {
				this._executeLocal(func, ...args);
			}
			catch (e) {
				console.error(e);
			}
		}
	}

	async executeForOtherGMs(handler, ...args) {
		const [name, func] = this._resolveFunction(handler);
		this._sendCommand(name, args, RECIPIENT_TYPES.ALL_GMS);
	}

	async executeForEveryone(handler, ...args) {
		const [name, func] = this._resolveFunction(handler);
		this._sendCommand(name, args, RECIPIENT_TYPES.EVERYONE);
		try {
			this._executeLocal(func, ...args);
		} catch (e) {
			console.error(e);
		}
	}

	async executeForOthers(handler, ...args) {
		const [name, func] = this._resolveFunction(handler);
		this._sendCommand(name, args, RECIPIENT_TYPES.EVERYONE);
	}

	async executeForUsers(handler, recipients, ...args) {
		if (!(recipients instanceof Array))
			throw new TypeError("Recipients parameter must be an array of user ids.");
		const [name, func] = this._resolveFunction(handler);
		const currentUserIndex = recipients.indexOf(game.userId);
		if (currentUserIndex >= 0)
			recipients.splice(currentUserIndex, 1);
		this._sendCommand(name, args, recipients);
		if (currentUserIndex >= 0) {
			try {
				this._executeLocal(func, ...args);
			}
			catch (e) {
				console.error(e);
			}
		}
	}

	_sendRequest(handlerName, args, recipient) {
		const message = {handlerName, args, recipient};
		message.id = foundry.utils.randomID();
		message.type = MESSAGE_TYPES.REQUEST;
		const promise = new Promise((resolve, reject) => this.pendingRequests.set(message.id, {handlerName, resolve, reject, recipient}));
		game.socket.emit(this.socketName, message);
		return promise;
	}

	_sendCommand(handlerName, args, recipient) {
		const message = {handlerName, args, recipient};
		message.type = MESSAGE_TYPES.COMMAND;
		game.socket.emit(this.socketName, message);
	}

	_sendResult(id, result) {
		const message = {id, result};
		message.type = MESSAGE_TYPES.RESULT;
		game.socket.emit(this.socketName, message);
	}

	_sendError(id, type) {
		const message = {id, type};
		message.userId = game.userId;
		game.socket.emit(this.socketName, message);
	}

	_executeLocal(func, ...args) {
		const socketdata = {userId: game.userId};
		return func.call({socketdata}, ...args);
	}

	_resolveFunction(func) {
		if (func instanceof Function) {
			const entry = Array.from(this.functions.entries()).find(([key, val]) => val === func);
			if (!entry)
				throw new errors.SocketlibUnregisteredHandlerError(`Function '${func.name}' has not been registered as a socket handler.`);
			return [entry[0], func];
		}
		else {
			const fn = this.functions.get(func);
			if (!fn)
				throw new errors.SocketlibUnregisteredHandlerError(`No socket handler with the name '${func}' has been registered.`)
			return [func, fn];
		}
	}

	_onSocketReceived(message, senderId) {
		if (message.type === MESSAGE_TYPES.COMMAND || message.type === MESSAGE_TYPES.REQUEST)
			this._handleRequest(message, senderId);
		else
			this._handleResponse(message, senderId);
	}

	async _handleRequest(message, senderId) {
		const {handlerName, args, recipient, id, type} = message;
		// Check if we're the recipient of the received message. If not, return early.
		if (recipient instanceof Array) {
			if (!recipient.includes(game.userId))
				return;
		}
		else {
			switch (recipient) {
				case RECIPIENT_TYPES.ONE_GM:
					if (!isResponsibleGM())
						return;
					break;
				case RECIPIENT_TYPES.ALL_GMS:
					if (!game.user.isGM)
						return;
					break;
				case RECIPIENT_TYPES.EVERYONE:
					break;
				default:
					console.error(`Unkown recipient '${recipient}' when trying to execute '${handlerName}' for '${this.socketName}'. This should never happen. If you see this message, please open an issue in the bug tracker of the socketlib repository.`);
					return;
			}
		}
		let name, func;
		try {
			[name, func] = this._resolveFunction(handlerName);
		}
		catch (e) {
			if (e instanceof errors.SocketlibUnregisteredHandlerError && type === MESSAGE_TYPES.REQUEST) {
				this._sendError(id, MESSAGE_TYPES.UNREGISTERED);
			}
			throw e;
		}
		const socketdata = {userId: senderId};
		const _this = {socketdata};
		if (type === MESSAGE_TYPES.COMMAND) {
			func.call(_this, ...args);
		}
		else {
			let result;
			try {
				result = await func.call(_this, ...args);
			}
			catch (e) {
				console.error(`An exception occured while executing handler '${name}'.`);
				this._sendError(id, MESSAGE_TYPES.EXCEPTION);
				throw e;
			}
			this._sendResult(id, result);
		}
	}

	_handleResponse(message, senderId) {
		const {id, result, type} = message;
		const request = this.pendingRequests.get(id);
		if (!request)
			return;
		if (!this._isResponseSenderValid(senderId, request.recipient)) {
			console.warn("socketlib | Dropped a response that was received from the wrong user. This means that either someone is inserting messages into the socket or this is a socketlib issue. If the latter is the case please file a bug report in the socketlib repository.")
			console.info(senderId, request.recipient);
			return;
		}
		switch (type) {
			case MESSAGE_TYPES.RESULT:
				request.resolve(result);
				break;
			case MESSAGE_TYPES.EXCEPTION:
				request.reject(new errors.SocketlibRemoteException(`An exception occured during remote execution of handler '${request.handlerName}'. Please see ${game.users.get(message.userId).name}'s error console for details.`));
				break;
			case MESSAGE_TYPES.UNREGISTERED:
				request.reject(new errors.SocketlibUnregisteredHandlerError(`Executing the handler '${request.handlerName}' has been refused by ${game.users.get(message.userId).name}'s client, because this handler hasn't been registered on that client.`));
				break;
			default:
				request.reject(new errors.SocketlibInternalError(`Unknown result type '${type}' for handler '${request.handlerName}'. This should never happen. If you see this message, please open an issue in the bug tracker of the socketlib repository.`));
				break;
		}
		this.pendingRequests.delete(id);
	}

	_isResponseSenderValid(senderId, recipients) {
		if (recipients === RECIPIENT_TYPES.ONE_GM && game.users.get(senderId).isGM)
			return true;
		if (recipients instanceof Array && recipients.includes(senderId))
			return true;
		return false;
	}
}

function isResponsibleGM() {
	if (!game.user.isGM)
		return false;
	const connectedGMs = game.users.filter(isActiveGM);
	return !connectedGMs.some(other => other.id < game.user.id);
}

function isActiveGM(user) {
	return user.active && user.isGM;
}

function handleUserActivity(wrapper, userId, activityData={}) {
	const user = game.users.get(userId);
	const wasActive = user.active;
	const result = wrapper(userId, activityData);

	// If user disconnected
	if (!user.active && wasActive) {
		const modules = Array.from(socketlib.modules.values());
		if (socketlib.system)
			modules.concat(socketlib.system);
		const GMConnected = Boolean(game.users.find(isActiveGM));
		// Reject all promises that are still waiting for a response from this player
		for (const socket of modules) {
			const failedRequests = Array.from(socket.pendingRequests.entries()).filter(([id, request]) => {
				const recipient = request.recipient;
				const handlerName = request.handlerName;
				if (recipient === RECIPIENT_TYPES.ONE_GM) {
					if (!GMConnected) {
						request.reject(new errors.SocketlibNoGMConnectedError(`Could not execute handler '${handlerName}' as GM, because all GMs disconnected while the execution was being dispatched.`));
						return true;
					}
				}
				else if (recipient instanceof Array) {
					if (recipient.includes(userId)) {
						request.reject(new errors.SocketlibInvalidUserError(`User '${game.users.get(userId).name}' (${userId}) disconnected while handler '${handlerName}' was being dispatched.`));
						return true;
					}
				}
				return false;
			});
			for (const [id, request] of failedRequests) {
				socket.pendingRequests.delete(id);
			}
		}
	}
	return result;
}
