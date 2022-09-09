import * as vscode from "vscode";
import PomodoroManager from "./pomodoroManager";

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration("pomodoro");
	const pomodoroManager = new PomodoroManager(config.workTime, config.pauseTime, config.countdown);

	// list of commands
	const startDisposable = vscode.commands.registerCommand("pomodoro.startPomodoro", () => {
		pomodoroManager.start();
	});

	const stopDisposable = vscode.commands.registerCommand("pomodoro.pausePomodoro", () => {
		pomodoroManager.pause();
	});

	const resetDisposable = vscode.commands.registerCommand("pomodoro.resetPomodoro", () => {
		console.log("🚀 ~ file: extension.ts ~ line 19 ~ resetDisposable ~ pomodoroManager.currentPomodoro", pomodoroManager.currentPomodoro)
		pomodoroManager.reset();
	});



	// Add to a list of disposables which are disposed when this extension is deactivated.
	context.subscriptions.push(pomodoroManager, startDisposable, stopDisposable, resetDisposable);
}

export function deactivate() {
	console.log("pomodoro deactivate");
}
