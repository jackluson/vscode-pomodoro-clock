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
	public pomodori: Pomodoro[];
	private _pomodoroCount: number;


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

	constructor(public vscodeContext: ExtensionContext, public workTime: number = 25, public breakTime: number = 5, public isCountDown: boolean = true) {
		// create status bar items
		if (!this._clockBarText) {
			this._clockBarText = window.createStatusBarItem(StatusBarAlignment.Left, 3);
			this._typeBarText = window.createStatusBarItem(StatusBarAlignment.Left, 2);
			// this._statusBarText.command = "pomodoro.startPomodoro";
			this._clockBarText.show();
		}
		this._commandMap = {
			start: {
				link: Uri.parse(
					`command:pomodoro.startPomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'start.svg')
			},
			pause: {
				link: Uri.parse(
					`command:pomodoro.pausePomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'pause.svg')
			},
			continue: {
				link: Uri.parse(
					`command:pomodoro.continuePomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'continue.svg')
			},
			restart: {
				link: Uri.parse(
					`command:pomodoro.restartPomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'restart.svg')
			},
			reset: {
				link: Uri.parse(
					`command:pomodoro.resetPomodoro`
				),
				imgSrc: Uri.joinPath(this.vscodeContext.extensionUri, 'assets/imgs', 'reset.svg')

			}
		}
		this.init();

		workspace.onDidChangeConfiguration(() => {
			const config = workspace.getConfiguration("pomodoro");
			this.isCountDown = config.get('countdown');
			this.setStatusBarText()
			this.currentPomodoro.isCountDown = this.isCountDown
		});
	}

	private setStatusBarText() {
		let currentTime = this.currentPomodoro.showTime
		const seconds = currentTime % 60;
		const minutes = (currentTime - seconds) / 60;
		// update status bar (text)
		const timerPart = ((minutes < 10) ? "0" : "") + minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;

		this._clockBarText.text = `$(clock) ${timerPart}`;
		if (this.currentPomodoro.type) {
			let pomodoroNumberPart = "";

			if (this.currentPomodoro.type === PomodoroType.Work) {
				pomodoroNumberPart += "(" + this._pomodoroCount + ")";
			}
			this._typeBarText.text = `${this.currentPomodoro.type + pomodoroNumberPart}`
			this._typeBarText.show()
		} else {
			this._typeBarText.hide()
		}
	}

	private setStatusBarTootip() {
		const btns = []
		if (this.currentPomodoro.status === PomodoroStatus.None) {
			btns.push(`<a href="${this._commandMap.start.link}"><img src="${this._commandMap.start.imgSrc}" /></a>`)
		}
		if (this.currentPomodoro.status === PomodoroStatus.Running) {
			btns.push(`<a href="${this._commandMap.pause.link}"><img src="${this._commandMap.pause.imgSrc}" /></a>`)
		} else if (this.currentPomodoro.status === PomodoroStatus.Paused) {
			btns.push(`<a href="${this._commandMap.continue.link}"><img src="${this._commandMap.continue.imgSrc}" /></a>`)
		}
		if (this.currentPomodoro.status !== PomodoroStatus.None) {
			btns.push(`<a href="${this._commandMap.restart.link}"><img src="${this._commandMap.restart.imgSrc}" /></a>`)
			btns.push(`<a href="${this._commandMap.reset.link}"><img src="${this._commandMap.reset.imgSrc}" /></a>`)
		}
		const contents = new MarkdownString(btns.join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'), true);
		contents.isTrusted = true;
		contents.supportHtml = true;
		this._clockBarText.tooltip = contents;
	}


	private tick() {
		if (this.currentPomodoro.status === PomodoroStatus.Done) {
			this._pomodoroCount++;
			this.reset()
		} else {
			this.draw()
		}
	}

	private draw() {
		this.setStatusBarText()
		this.setStatusBarTootip()
	}

	// public methods
	public start() {
		this.currentPomodoro.start();
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
		this.pomodori = [];
		this.pomodori.push(new Pomodoro(this.workTime * 60, this.breakTime * 60, this.isCountDown));
		this.draw()
	}

	public reset() {
		this.currentPomodoro.reset()
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
