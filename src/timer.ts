class Timer {
	private _timerId: NodeJS.Timer;
	private _accumulateTime: number;

	public get isRunning() {
		return this._timerId != null;
	}

	constructor(public interval: number = 1000) {
		this._timerId = null;
		this._accumulateTime = 0;
	}

	public reset() {
		this.stop();
		this._accumulateTime = 0;
	}

	public start(callback) {
		if (this._timerId == null) {
			this._timerId = setInterval(() => {
				this.tick();
				callback();
			}, this.interval);
		}
		else {
			console.error("A timer instance is already running...");
		}
	}

	public stop() {
		if (this._timerId != null) {
			clearInterval(this._timerId);
		}

		this._timerId = null;
	}

	private tick() {
		this._accumulateTime += this.interval / 1000;
	}

	get accumulateTime() {
		return this._accumulateTime;
	}
}

export default Timer;
