import * as vscode from "vscode";
import PomodoroManager from "./pomodoroManager";


export function activate(context: vscode.ExtensionContext) {
	const pomodoroManager = new PomodoroManager(context);
	// list of commands
	const startDisposable = vscode.commands.registerCommand("pomodoroClock.startPomodoro", () => {
		pomodoroManager.start();
	});

	const pauseDisposable = vscode.commands.registerCommand("pomodoroClock.pausePomodoro", () => {
		pomodoroManager.pause();
	});

	const continueDisposable = vscode.commands.registerCommand("pomodoroClock.continuePomodoro", () => {
		pomodoroManager.continue();
	});

	const restartDisposable = vscode.commands.registerCommand("pomodoroClock.restartPomodoro", () => {
		pomodoroManager.restart();
	});

	const resetDisposable = vscode.commands.registerCommand("pomodoroClock.resetPomodoro", () => {
		pomodoroManager.reset();
	});

	const toggleDisposable = vscode.commands.registerCommand("pomodoroClock.toggleCurrentPomodoroCountdown", () => {
		pomodoroManager.toggleCountdown();
	});

	// Add to a list of disposables which are disposed when this extension is deactivated.
	context.subscriptions.push(pomodoroManager, startDisposable, pauseDisposable, continueDisposable, restartDisposable, resetDisposable, toggleDisposable);
}

export function deactivate() {
	console.log("pomodoro deactivate");
}
