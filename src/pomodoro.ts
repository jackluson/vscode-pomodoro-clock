import { PomodoroType, PomodoroStatus } from "./pomodoroEnum";
import Timer from "./timer";

class Pomodoro {
	// properties
	private _type: PomodoroType;

	public get type() {
		return this._type;
	}
	public set type(type: PomodoroType) {
		this._type = type;
	}

	private _timer: Timer;
	private _status: PomodoroStatus;

	public get timer() {
		return this._timer;
	}

	public get status() {
		return this._status;
	}

	public get totalTime() {
		let totalTime = 0;
		if (this.type === PomodoroType.Work) {
			totalTime = this.workTime
		} else if (this.type === PomodoroType.Break) {
			totalTime = this.breakTime
		} else if (this.type === PomodoroType.LongBreak) {
			totalTime = this.longBreakTime
		}
		return totalTime
	}

	public get showTime() {
		if (!this.isCountDown) return this.timer.accumulateTime
		return this.totalTime - this.timer.accumulateTime;
	}

	// tick callback
	public onTick: () => void;

	constructor(public workTime: number = 25 * 60, public breakTime: number = 5 * 60, public longBreakTime: number, public isCountDown: boolean = true, type = PomodoroType.Work) {
		this.workTime = Math.floor(this.workTime);
		this.breakTime = Math.floor(this.breakTime);
		this.longBreakTime = Math.floor(this.longBreakTime);
		this._timer = new Timer();
		this._type = type;
		this._status = PomodoroStatus.None
	}

	// private methods
	private done() {
		this.timer.reset();
		this._status = PomodoroStatus.Done;
	}

	private tick() {
		this._status = PomodoroStatus.Running
		this._timer.start(async () => {
			// console.log('tick', Math.random())
			// stop the timer if no second left
			const isDone = this.type === PomodoroType.Work && this.timer.accumulateTime === this.workTime || this.type === PomodoroType.Break && this.timer.accumulateTime === this.breakTime || this.type === PomodoroType.LongBreak && this.timer.accumulateTime === this.longBreakTime

			if (isDone) {
				this.done();
			}
			if (this.onTick) {
				this.onTick();
			}
		});
	}

	// public methods
	public start(type: PomodoroType = PomodoroType.Work) {
		if (type) {
			this.type = type;
			this.tick()
		}
		else {
			console.error("Start timer error");
		}
	}

	public continue() {
		if (this.status === PomodoroStatus.Paused) {
			this.tick();
		}
	}

	public restart() {
		this.timer.reset();
		this.tick();
	}

	public pause() {
		this.stop();
		this._status = PomodoroStatus.Paused
	}

	public reset() {
		this._status = PomodoroStatus.None
		this._type = PomodoroType.Work
		this.timer.reset();
	}

	public stop() {
		this._timer.stop();
	}

	public dispose() {
		this.stop();
		this.type = PomodoroType.Work;
		this._status = PomodoroStatus.Paused
	}
}

export default Pomodoro;
