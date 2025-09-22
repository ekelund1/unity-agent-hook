import * as vscode from 'vscode';
import axios from 'axios';

async function showResultInNewDocument(content: string, language: string) {
    const document = await vscode.workspace.openTextDocument({ content, language });
    await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Unity Agent Controller is now active.');

    let recompileCommand = vscode.commands.registerCommand('unity-agent.recompile', async () => {
        vscode.window.showInformationMessage('Sending recompile command to Unity...');
        try {
            const response = await axios.get('http://localhost:8080/refresh', { timeout: 30000 });
            // Show plain text result
            await showResultInNewDocument(response.data, 'plaintext');
        } catch (error: any) {
            // Show error in a new document for better readability
            await showResultInNewDocument(`Unity Recompile Failed:\n\n${error.message}`, 'plaintext');
        }
    });

    let runTestsCommand = vscode.commands.registerCommand('unity-agent.runTests', async () => {
        vscode.window.showInformationMessage('Sending run tests command to Unity...');
        try {
            const response = await axios.get('http://localhost:8080/run-tests', { timeout: 120000 });
            const prettyJson = JSON.stringify(response.data, null, 2);
            // Show result as JSON for syntax highlighting
            await showResultInNewDocument(prettyJson, 'json');
        } catch (error: any) {
            await showResultInNewDocument(`Unity Test Run Failed:\n\n${error.message}`, 'plaintext');
        }
    });

    context.subscriptions.push(recompileCommand, runTestsCommand);
}

export function deactivate() {}