import * as vscode from "vscode";
import PomodoroManager from "./pomodoroManager";


export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration("pomodoro");
	const pomodoroManager = new PomodoroManager(context, config.workTime, config.breakTime, config.countdown);

	// list of commands
	const startDisposable = vscode.commands.registerCommand("pomodoro.startPomodoro", () => {
		pomodoroManager.start();
	});

	const pauseDisposable = vscode.commands.registerCommand("pomodoro.pausePomodoro", () => {
		pomodoroManager.pause();
	});

	const continueDisposable = vscode.commands.registerCommand("pomodoro.continuePomodoro", () => {
		pomodoroManager.continue();
	});

	const restartDisposable = vscode.commands.registerCommand("pomodoro.restartPomodoro", () => {
		pomodoroManager.restart();
	});

	const resetDisposable = vscode.commands.registerCommand("pomodoro.resetPomodoro", () => {
		pomodoroManager.reset();
	});



	// Add to a list of disposables which are disposed when this extension is deactivated.
	context.subscriptions.push(pomodoroManager, startDisposable, pauseDisposable, continueDisposable, restartDisposable, resetDisposable);
}

export function deactivate() {
	console.log("pomodoro deactivate");
}
