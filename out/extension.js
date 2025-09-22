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
const axios_1 = __importDefault(require("axios")); // For making HTTP requests
// This method is called when your extension is activated
function activate(context) {
    console.log('Congratulations, your extension "unity-agent-controller" is now active!');
    // --- IMPLEMENTATION OF THE RECOMPILE COMMAND ---
    let recompileCommand = vscode.commands.registerCommand('unity-agent.recompile', async () => {
        vscode.window.showInformationMessage('Sending recompile command to Unity...');
        try {
            const response = await axios_1.default.get('http://localhost:8080/refresh', { timeout: 30000 });
            vscode.window.showInformationMessage('Unity Recompile Result: Success');
            // A more advanced implementation would show the result in a new document
            return response.data;
        }
        catch (error) {
            console.error('Unity Recompile Failed:', error.message);
            vscode.window.showErrorMessage('Unity Recompile Failed: ' + error.message);
            return 'Error: ' + error.message;
        }
    });
    // --- IMPLEMENTATION OF THE RUN TESTS COMMAND ---
    let runTestsCommand = vscode.commands.registerCommand('unity-agent.runTests', async () => {
        vscode.window.showInformationMessage('Sending run tests command to Unity...');
        try {
            const response = await axios_1.default.get('http://localhost:8080/run-tests', { timeout: 120000 });
            vscode.window.showInformationMessage('Unity Test Run Complete.');
            // Return the raw JSON string for the agent to process
            return JSON.stringify(response.data, null, 2);
        }
        catch (error) {
            console.error('Unity Test Run Failed:', error.message);
            vscode.window.showErrorMessage('Unity Test Run Failed: ' + error.message);
            return 'Error: ' + error.message;
        }
    });
    context.subscriptions.push(recompileCommand, runTestsCommand);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map