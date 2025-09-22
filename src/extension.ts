import * as vscode from 'vscode';
import axios from 'axios'; // For making HTTP requests

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "unity-agent-controller" is now active!');

    // --- IMPLEMENTATION OF THE RECOMPILE COMMAND ---
    let recompileCommand = vscode.commands.registerCommand('unity-agent.recompile', async () => {
        vscode.window.showInformationMessage('Sending recompile command to Unity...');
        try {
            const response = await axios.get('http://localhost:8080/refresh', { timeout: 30000 });
            vscode.window.showInformationMessage('Unity Recompile Result: Success');
            // A more advanced implementation would show the result in a new document
            return response.data; 
        } catch (error: any) {
            console.error('Unity Recompile Failed:', error.message);
            vscode.window.showErrorMessage('Unity Recompile Failed: ' + error.message);
            return 'Error: ' + error.message;
        }
    });

    // --- IMPLEMENTATION OF THE RUN TESTS COMMAND ---
    let runTestsCommand = vscode.commands.registerCommand('unity-agent.runTests', async () => {
        vscode.window.showInformationMessage('Sending run tests command to Unity...');
        try {
            const response = await axios.get('http://localhost:8080/run-tests', { timeout: 120000 });
            vscode.window.showInformationMessage('Unity Test Run Complete.');
            // Return the raw JSON string for the agent to process
            return JSON.stringify(response.data, null, 2);
        } catch (error: any) {
            console.error('Unity Test Run Failed:', error.message);
            vscode.window.showErrorMessage('Unity Test Run Failed: ' + error.message);
            return 'Error: ' + error.message;
        }
    });

    context.subscriptions.push(recompileCommand, runTestsCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}