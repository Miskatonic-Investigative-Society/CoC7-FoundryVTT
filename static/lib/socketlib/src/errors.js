export class SocketlibError extends Error {
	constructor(...args) {
		super(...args);
		this.name = "SocketlibError";
	}
}

export class SocketlibInternalError extends SocketlibError {
	constructor(...args) {
		super(...args);
		this.name = "SocketlibInternalError";
	}
}

export class SocketlibInvalidUserError extends SocketlibError {
	constructor(...args) {
		super(...args);
		this.name = "SocketlibInvalidUserError";
	}
}

export class SocketlibNoGMConnectedError extends SocketlibError {
	constructor(...args) {
		super(...args);
		this.name = "SocketlibNoGMConnectedError";
	}
}

export class SocketlibRemoteException extends SocketlibError {
	constructor(...args) {
		super(...args);
		this.name = "SocketlibRemoteException";
	}
}

export class SocketlibUnregisteredHandlerError extends SocketlibError {
	constructor(...args) {
		super(...args);
		this.name = "SocketlibUnregisteredHandlerError";
	}
}
