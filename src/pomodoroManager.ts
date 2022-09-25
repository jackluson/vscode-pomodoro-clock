import { StatusBarAlignment, StatusBarItem, window, workspace, MarkdownString, Uri, ExtensionContext } from "vscode";

import Pomodoro from "./pomodoro";
import { PomodoroType, PomodoroStatus } from "./pomodoroEnum";

type CommandStatus = 'start' | 'pause' | 'continue' | 'restart' | 'reset';

class PomodoroManager {
	// logic properties
	private _pomodoroIndex: number;
	private _commandMap: Record<CommandStatus, {
		link: Uri,
		imgSrc: Uri
	}>;
	public workTime: number;
	public breakTime: number;
	public longBreakTime: number;
	public isCountDown: boolean;
	public repeat: number;
	public pomodori: Pomodoro[];
	private _pomodoroCount: number;
	private _breakCount: number;


	public get currentPomodoro() {
		return this.pomodori[this._pomodoroIndex];
	}

	public get isSessionFinished(): boolean {
		return !this.currentPomodoro;
	}
	// UI properties
	private _clockBarText: StatusBarItem;
	private _typeBarText: StatusBarItem;
	// private _vscodeContext: ExtensionContext

	constructor(public vscodeContext: ExtensionContext) {
		// create status bar items
		if (!this._clockBarText) {
			this._clockBarText = window.createStatusBarItem(StatusBarAlignment.Left, 3);
			this._typeBarText = window.createStatusBarItem(StatusBarAlignment.Left, 2);
			this._clockBarText.command = "pomodoroClock.toggleCurrentPomodoroCountdown";
			this._clockBarText.show();
		}
		this._commandMap = {
			start: {
				link: Uri.parse(
					`command:pomodoroClock.startPomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'start.svg')
			},
			pause: {
				link: Uri.parse(
					`command:pomodoroClock.pausePomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'pause.svg')
			},
			continue: {
				link: Uri.parse(
					`command:pomodoroClock.continuePomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'continue.svg')
			},
			restart: {
				link: Uri.parse(
					`command:pomodoroClock.restartPomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'restart.svg')
			},
			reset: {
				link: Uri.parse(
					`command:pomodoroClock.resetPomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'reset.svg')

			}
		}
		this.init();

		workspace.onDidChangeConfiguration(() => {
			this.setParamsFromConfig()
			this.setTypeStatusBar()
			this.currentPomodoro.isCountDown = this.isCountDown
		});
	}

	private setParamsFromConfig() {
		const config = workspace.getConfiguration("pomodoroClock");
		this.workTime = config.get('workTime')
		this.breakTime = config.get('breakTime')
		this.longBreakTime = config.get('longBreakTime')
		this.isCountDown = config.get('isCountDown')
		this.repeat = config.get('repeat')
	}

	private getShowClock(inputTime) {
		const seconds = inputTime % 60;
		const minutes = (inputTime - seconds) / 60;
		// update status bar (text)
		const showClock = ((minutes < 10) ? "0" : "") + minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;
		return showClock
	}

	private setTypeStatusBar() {
		let countNumberPart = "";
		if (this.currentPomodoro.type) {

			if (this.currentPomodoro.type === PomodoroType.Work) {
				countNumberPart += "(" + this._pomodoroCount + ")";
			} else if (this.currentPomodoro.type === PomodoroType.Break || this.currentPomodoro.type === PomodoroType.LongBreak) {
				countNumberPart += "(" + this._breakCount + ")";
			}
			this._typeBarText.text = `${this.currentPomodoro.type + countNumberPart}`
			this._typeBarText.tooltip = `total: ${this.getShowClock(this.currentPomodoro.totalTime)}`
			this._typeBarText.show()
		} else {
			this._typeBarText.hide()
		}
	}

	private setClockStatusBar() {
		const btns = []
		if (this.currentPomodoro.status === PomodoroStatus.None || this.currentPomodoro.status === PomodoroStatus.Done) {
			btns.push(`<a href="${this._commandMap.start.link}"><img src="${this._commandMap.start.imgSrc}" /></a>`)
		}
		if (this.currentPomodoro.status === PomodoroStatus.Running) {
			btns.push(`<a href="${this._commandMap.pause.link}"><img src="${this._commandMap.pause.imgSrc}" /></a>`)
		} else if (this.currentPomodoro.status === PomodoroStatus.Paused) {
			btns.push(`<a href="${this._commandMap.continue.link}"><img src="${this._commandMap.continue.imgSrc}" /></a>`)
		}
		if (this.currentPomodoro.status !== PomodoroStatus.None && this.currentPomodoro.status !== PomodoroStatus.Done) {
			btns.push(`<a href="${this._commandMap.restart.link}"><img src="${this._commandMap.restart.imgSrc}" /></a>`)
			btns.push(`<a href="${this._commandMap.reset.link}"><img src="${this._commandMap.reset.imgSrc}" /></a>`)
		}
		let currentTime = this.currentPomodoro.showTime
		let timerPart = this.getShowClock(currentTime)
		this._clockBarText.text = `$(clock) ${timerPart}`;
		const contents = new MarkdownString(btns.join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'), true);
		contents.isTrusted = true;
		contents.supportHtml = true;
		this._clockBarText.tooltip = contents;
	}

	private async tick() {
		if (this.currentPomodoro.status === PomodoroStatus.Done) {
			if (this.currentPomodoro.type === PomodoroType.Work) {
				const isLongBreack = !(this._pomodoroCount % this.repeat)
				this._pomodoroCount++;
				this.currentPomodoro.type = isLongBreack ? PomodoroType.LongBreak : PomodoroType.Break;
				const breakText = isLongBreack ? 'Long Break' : 'Break'
				window.showInformationMessage("Work done! Take a break.", breakText, "Next work",).then((select) => {
					if (select === breakText) {
						this.start(isLongBreack ? PomodoroType.LongBreak : PomodoroType.Break);
					} else if (select === 'Next work') {
						this.start(PomodoroType.Work);
					}
				})
			} else if (this.currentPomodoro.type === PomodoroType.Break) {
				this._breakCount++;
				this.currentPomodoro.type = PomodoroType.Work;
				window.showInformationMessage("Break is over.", 'Next work', "Continue break").then((select) => {
					if (select === 'Continue break') {
						this.start(PomodoroType.Break);
					} else if (select === 'Next work') {
						this.start(PomodoroType.Work);
					}
				})
			} else if (this.currentPomodoro.type === PomodoroType.LongBreak) {
				this._breakCount++;
				this.currentPomodoro.type = PomodoroType.Work;
				window.showInformationMessage("Break is over.", 'Next work', "Continue break").then((select) => {
					if (select === 'Continue break') {
						this.start(PomodoroType.LongBreak);
					} else if (select === 'Next work') {
						this.start(PomodoroType.Work);
					}
				});
			}
		}
		this.draw()
	}

	private draw() {
		this.setTypeStatusBar()
		this.setClockStatusBar()
	}

	// public methods
	public start(type: PomodoroType = PomodoroType.Work) {
		this.currentPomodoro.start(type);
		this.currentPomodoro.onTick = () => {
			this.tick()
		};
	}

	public continue() {
		this.currentPomodoro.continue();
		this.currentPomodoro.onTick = () => {
			this.tick()
		};
	}

	public restart() {
		this.currentPomodoro.restart();
		this.currentPomodoro.onTick = () => {
			this.tick()
		};
	}

	public pause() {
		this.currentPomodoro.pause();
		this.draw();
	}

	public init() {
		this._pomodoroIndex = 0;
		this._pomodoroCount = 1;
		this._breakCount = 1
		this.setParamsFromConfig()
		this.pomodori = [];
		this.pomodori.push(new Pomodoro(this.workTime * 60, this.breakTime * 60, this.longBreakTime * 60, this.isCountDown));
		this.draw()
	}

	public reset() {
		this.currentPomodoro.reset()
		this.draw()
	}

	public toggleCountdown() {
		this.isCountDown = !this.isCountDown;
		this.currentPomodoro.isCountDown = this.isCountDown;
		this.draw()
	}

	public dispose() {
		// stop current Pomodoro
		this.currentPomodoro.dispose();
		// reset UI
		this._clockBarText.dispose();
	}
}

export default PomodoroManager;
