import { StatusBarAlignment, StatusBarItem, window, workspace, MarkdownString, Uri, ExtensionContext } from "vscode";

import Pomodoro from "./pomodoro";
import PomodoroStatus from "./pomodoroStatus";

type CommandStatus = 'start' | 'pause' | 'continue' | 'restart';

class PomodoroManager {
	// logic properties
	private _pomodoroIndex: number;
	private _commandMap: Record<CommandStatus, {
		link: Uri,
		imgSrc: Uri
	}>;
	public pomodori: Pomodoro[];

	public get currentPomodoro() {
		return this.pomodori[this._pomodoroIndex];
	}

	public get currentState() {
		switch (this.currentPomodoro.status) {
			case PomodoroStatus.Work:
				return " - work";
			case PomodoroStatus.Rest:
				return " - rest";
			case PomodoroStatus.Paused:
				return " - paused";
			case PomodoroStatus.Break:
				return " - break";
			default:
				return "";
		}
	}

	public get isSessionFinished(): boolean {
		return !this.currentPomodoro;
	}

	// UI properties
	private _statusBarText: StatusBarItem;
	private _statusBarStartButton: StatusBarItem;
	private _statusBarPauseButton: StatusBarItem;
	// private _vscodeContext: ExtensionContext


	constructor(public vscodeContext: ExtensionContext, public workTime: number = 25, public pauseTime: number = 5, public isCountDown: boolean = true) {
		// create status bar items
		if (!this._statusBarText) {
			this._statusBarText = window.createStatusBarItem(StatusBarAlignment.Left, 3);
			// this._statusBarText.command = "pomodoro.startPomodoro";
			this._statusBarText.show();
		}
		if (!this._statusBarStartButton) {
			this._statusBarStartButton = window.createStatusBarItem(StatusBarAlignment.Left);
			this._statusBarStartButton.text = "$(triangle-right)";
			this._statusBarStartButton.command = "pomodoro.startPomodoro";
			this._statusBarStartButton.tooltip = "Start Pomodoro";
		}
		if (!this._statusBarPauseButton) {
			this._statusBarPauseButton = window.createStatusBarItem(StatusBarAlignment.Left);
			this._statusBarPauseButton.text = "$(primitive-square)";
			this._statusBarPauseButton.command = "pomodoro.pausePomodoro";
			this._statusBarPauseButton.tooltip = "Pause Pomodoro";
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
			}
		}
		this.reset();
		this.draw();
		workspace.onDidChangeConfiguration(() => {
			const config = workspace.getConfiguration("pomodoro");
			this.isCountDown = config.get('countdown');
			this.setStatusBarText()
		});
	}

	// private methods
	private update() {
		// handle launch of the next Pomodoro
		if (this.currentPomodoro.status === PomodoroStatus.Done) {
			this._pomodoroIndex++;

			if (!this.isSessionFinished) {
				this.start();
			}
		}
	}

	private setStatusBarText() {
		let currentTime = this.currentPomodoro.timer.currentTime
		if (this.isCountDown) {
			currentTime = this.workTime * 60 - this.currentPomodoro.timer.currentTime;
		}
		const seconds = currentTime % 60;
		const minutes = (currentTime - seconds) / 60;

		// update status bar (text)
		const timerPart = ((minutes < 10) ? "0" : "") + minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;

		let pomodoroNumberPart = "";
		if (this.pomodori.length > 1) {
			pomodoroNumberPart += " (" + (this._pomodoroIndex + 1) + " out of " + this.pomodori.length + " pomodori)";
		}

		this._statusBarText.text = `$(clock) ${timerPart + this.currentState + pomodoroNumberPart}`;
	}

	private setStatusBarTootip() {
		const btns = [
			// `<a href="${startCommandUri}"><img src="${imgSrcUrlStart.path}" /></a>`,
			// `<a href="${pauseCommandUri}"><img src="${imgSrcUrlPause.path}" /></a>`,
			// `<a disabled class="disabled" style="opacity:0.6;" href="${stageCommandUri2}">$(debug-pause)</a>`,
			// `<a href="${stageCommandUri}">${'reset'}</a>`,
		]
		if (this.currentPomodoro.status === PomodoroStatus.None) {
			btns.push(`<a href="${this._commandMap.start.link}"><img src="${this._commandMap.start.imgSrc}" /></a>`)
		}
		if (this.currentPomodoro.status === PomodoroStatus.Work) {
			btns.push(`<a href="${this._commandMap.pause.link}"><img src="${this._commandMap.pause.imgSrc}" /></a>`)
		} else if (this.currentPomodoro.status === PomodoroStatus.Paused) {
			btns.push(`<a href="${this._commandMap.continue.link}"><img src="${this._commandMap.continue.imgSrc}" /></a>`)
		}
		if (this.currentPomodoro.status !== PomodoroStatus.None) {
			btns.push(`<a href="${this._commandMap.restart.link}"><img src="${this._commandMap.restart.imgSrc}" /></a>`)
		}

		const wrapper = `<div style="margin-top:48px;">${btns.join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')}</div>`;
		console.log("wrapper", wrapper);

		const contents = new MarkdownString(btns.join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'), true);
		// const contents = new MarkdownString(`[reset](${stageCommandUri})`, true);
		console.log("contents", contents);
		contents.isTrusted = true;
		contents.supportHtml = true;
		this._statusBarText.tooltip = contents;
	}


	private draw() {
		if (this.isSessionFinished) {
			// show text when all Pomodoro sessions are over
			this._statusBarText.text = "Restart session?";
			this._statusBarStartButton.show();
			this._statusBarPauseButton.hide();

			// show message if user needs a longer break
			if (this.pomodori.length > 1) {
				window.showInformationMessage("Well done! You should now take a longer break.");
			}

			return;
		}

		// const minutes = (this.currentPomodoro.timer.currentTime - seconds) / 60;
		// const seconds = this.currentPomodoro.timer.currentTime % 60;

		const markdown = new MarkdownString(`
|    <span style="color:#ff0;background-color:#000;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Table&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>|    Header     |
|    :----:    |    :----:     |
|first cell    |second cell  |
|third cell    |<span style="color:#f00;background-color:#fff;">&nbsp;&nbsp;fourth cell&nbsp;&nbsp;</span>  |
        \n\n\n`);  // the newline is necessary for any following appends to work correctly, multiple newlines are reduced to one

		const styledString = `<span style="color:#fff;background-color:#666;">&nbsp;&nbsp;&nbsp;NASA code follows:&nbsp;&nbsp;&nbsp;</span>`;
		const styledSvgString = `<p style="color:#fff;background-color:#666;">2121</p>`;

		const codeBlock = `const a = 12;
if (a) return;`;    // any preceding tabs will be rendered in a template literal, so flush left

		// const codeBlock2 = `const c = 12;\nif (c) return;`;  // works, alternate form with newline

		markdown.appendText("______________________________\n");  // a fake separator
		markdown.appendMarkdown(styledString);
		markdown.appendText("\n");  // a fake separator

		markdown.appendMarkdown(styledSvgString);
		markdown.appendCodeblock(codeBlock, "javascript");
		markdown.appendMarkdown(
			`**Bold Text**
* some note
* another note
* final note`
		);

		markdown.isTrusted = true;
		this.setStatusBarText()
		this.setStatusBarTootip()

		if (this.currentPomodoro.status === PomodoroStatus.None ||
			this.currentPomodoro.status === PomodoroStatus.Paused) {
			this._statusBarStartButton.show();
			this._statusBarPauseButton.hide();
		}
		else {
			this._statusBarStartButton.hide();
			this._statusBarPauseButton.show();
		}

		// this._statusBarText.show();
	}

	// public methods
	public start() {
		// launch a new session if the previous is already finished
		if (this.isSessionFinished) {
			this._pomodoroIndex = 0;
		}

		this.currentPomodoro.start();
		this.currentPomodoro.onTick = () => {
			this.update();
			this.draw();
		};
	}

	public continue() {
		this.currentPomodoro.continue();
		this.currentPomodoro.onTick = () => {
			this.update();
			this.draw();
		};
	}

	public restart() {
		this.currentPomodoro.restart();
		this.currentPomodoro.onTick = () => {
			this.update();
			this.draw();
		};
	}

	public pause() {
		this.currentPomodoro.pause();
		this.update();
		this.draw();
	}

	public reset() {
		this._pomodoroIndex = 0;
		this.pomodori = [];
		this.pomodori.push(new Pomodoro(this.workTime * 60, this.pauseTime * 60));
	}

	public dispose() {
		// stop current Pomodoro
		this.currentPomodoro.dispose();
		// reset UI
		this._statusBarText.dispose();
		this._statusBarStartButton.dispose();
		this._statusBarPauseButton.dispose();
	}
}

export default PomodoroManager;
