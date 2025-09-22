"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
async function showResultInNewDocument(content, language) {
    const document = await vscode.workspace.openTextDocument({ content, language });
    await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
}
function activate(context) {
    console.log('Unity Agent Controller is now active.');
    let recompileCommand = vscode.commands.registerCommand('unity-agent.recompile', async () => {
        vscode.window.showInformationMessage('Sending recompile command to Unity...');
        try {
            const response = await axios_1.default.get('http://localhost:8080/refresh', { timeout: 30000 });
            // Show plain text result
            await showResultInNewDocument(response.data, 'plaintext');
        }
        catch (error) {
            // Show error in a new document for better readability
            await showResultInNewDocument(`Unity Recompile Failed:\n\n${error.message}`, 'plaintext');
        }
    });
    let runTestsCommand = vscode.commands.registerCommand('unity-agent.runTests', async () => {
        vscode.window.showInformationMessage('Sending run tests command to Unity...');
        try {
            const response = await axios_1.default.get('http://localhost:8080/run-tests', { timeout: 120000 });
            const prettyJson = JSON.stringify(response.data, null, 2);
            // Show result as JSON for syntax highlighting
            await showResultInNewDocument(prettyJson, 'json');
        }
        catch (error) {
            await showResultInNewDocument(`Unity Test Run Failed:\n\n${error.message}`, 'plaintext');
        }
    });
    context.subscriptions.push(recompileCommand, runTestsCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map