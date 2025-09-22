# Unity Agent Hook

A Visual Studio Code extension that acts as a bridge between an LLM agent (like GitHub Copilot) and a running Unity Editor instance. It provides the necessary "hands" for an agent to compile code and run tests, completing the feedback loop for agentic development.

## The Problem

LLM agents can write code but cannot interact with external applications like the Unity Editor. Unity requires focus to detect file changes, recompile scripts, and run its Test Runner. This extension solves that problem by exposing key Unity functions through VS Code commands, which an agent can then call.

## Features

This extension provides two primary commands that an LLM agent can invoke:

*   **`Unity Agent: Force Recompile` (`unity-agent.recompile`)**: Instructs the Unity Editor to immediately perform an asset refresh and recompile all C# scripts. The output (success or compilation errors) is displayed in a new editor tab.
*   **`Unity Agent: Run Unit Tests` (`unity-agent.runTests`)**: Instructs the Unity Editor to run all EditMode tests via the Unity Test Framework. The results are returned as a formatted JSON object in a new editor tab.

## System Requirements & Prerequisites

Before installing, ensure your environment is set up correctly.

### 1. Unity Project Setup

Your Unity project must be running a small C# server to listen for commands from this extension.

1.  In your Unity project's `Assets` folder, create a new folder named `Editor`.
2.  Inside the `Assets/Editor` folder, create a new C# script named `EditorApiServer.cs`.
3.  Paste the entire contents of the script below into `EditorApiServer.cs`.

<details>
<summary>Click to view EditorApiServer.cs code</summary>

```csharp
using UnityEditor;
using UnityEngine;
using UnityEditor.TestTools.TestRunner.Api;
using System.Net;
using System.Threading;
using System.Text;
using System.Collections.Generic;

[InitializeOnLoad]
public static class EditorApiServer
{
    private static readonly HttpListener _listener = new HttpListener();
    private static readonly TestCallbacks _testCallbacks = new TestCallbacks();
    private static bool _needsRefresh = false;
    private static bool _needsTestRun = false;

    static EditorApiServer()
    {
        if (_listener.IsListening) return;

        _listener.Prefixes.Add("http://localhost:8080/");
        _listener.Start();
        new Thread(HandleRequests).Start();
        EditorApplication.update += OnUpdate;
        Debug.Log("Editor API Server started. Endpoints: /refresh, /run-tests");
    }

    private static void OnUpdate()
    {
        if (_needsRefresh)
        {
            _needsRefresh = false;
            Debug.Log("Server triggered AssetDatabase.Refresh().");
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
        }
        if (_needsTestRun)
        {
            _needsTestRun = false;
            Debug.Log("Server triggered Test Runner.");
            RunTests();
        }
    }

    private static void HandleRequests()
    {
        while (_listener.IsListening)
        {
            var context = _listener.GetContext();
            var request = context.Request;
            var response = context.Response;
            string responseString = "";
            
            if (request.Url.AbsolutePath == "/refresh")
            {
                _needsRefresh = true;
                responseString = "Refresh command received and queued for main thread.";
            }
            else if (request.Url.AbsolutePath == "/run-tests")
            {
                _testCallbacks.Reset();
                _needsTestRun = true;
                _testCallbacks.WaitForCompletion(); 
                responseString = _testCallbacks.GetResultAsJson();
                response.ContentType = "application/json";
            }
            else
            {
                response.StatusCode = 404;
                responseString = "Not Found.";
            }

            byte[] buffer = Encoding.UTF8.GetBytes(responseString);
            response.ContentLength64 = buffer.Length;
            response.OutputStream.Write(buffer, 0, buffer.Length);
            response.OutputStream.Close();
        }
    }

    private static void RunTests()
    {
        var testRunnerApi = ScriptableObject.CreateInstance<TestRunnerApi>();
        var filter = new Filter() { testMode = TestMode.EditMode };
        testRunnerApi.Execute(new ExecutionSettings(filter));
        testRunnerApi.RegisterCallbacks(_testCallbacks);
    }

    public class TestCallbacks : ICallbacks
    {
        private readonly ManualResetEvent _waitHandle = new ManualResetEvent(false);
        public ITestResultAdaptor Result { get; private set; }

        public void RunStarted(ITestAdaptor testsToRun) {}

        public void RunFinished(ITestResultAdaptor result) 
        {
            Result = result;
            _waitHandle.Set();
        }

        public void TestStarted(ITestAdaptor test) {}
        public void TestFinished(ITestResultAdaptor result) {}

        public void Reset()
        {
            Result = null;
            _waitHandle.Reset();
        }

        public void WaitForCompletion()
        {
            _waitHandle.WaitOne();
        }
        
        public string GetResultAsJson()
        {
            if (Result == null) return "{\"error\":\"No result available.\"}";
            return string.Format(
                "{{ \"result\":\"{0}\", \"passed\":{1}, \"failed\":{2}, \"inconclusive\":{3}, \"skipped\":{4}, \"total\":{5} }}",
                Result.ResultState,
                Result.PassCount,
                Result.FailCount,
                Result.InconclusiveCount,
                Result.SkipCount,
                Result.TestAttachmentCount
            );
        }
    }
}
```
</details>

This server will now start automatically whenever you open your Unity project.

### 2. Development Environment

*   [**Node.js (LTS)**](https://nodejs.org/) must be installed. This includes the Node Package Manager (NPM).

## Installation

1.  **Install Dependencies:** Open a terminal in the root of this project folder and run:
    ```bash
    npm install
    ```
2.  **Install VSCE:** Install the official extension packaging tool globally.
    ```bash
    npm install -g @vscode/vsce
    ```3.  **Package the Extension:** Run the packaging command in the terminal.
    ```bash
    vsce package
    ```
    This will create a `unity-agent-hook-X.X.X.vsix` file in your project folder.
4.  **Install the VSIX:**
    *   Open VS Code and navigate to the **Extensions** view.
    *   Click the `...` menu in the top-right corner.
    *   Select **Install from VSIX...** and choose the `.vsix` file you just created.
    *   Reload VS Code when prompted.

## Usage Workflow

This extension is designed to be used in a conversational workflow with an LLM agent like Copilot Chat.

1.  **Start Services:** Open your Unity project and wait for the "Editor API Server started" message in the console. Open your Unity project folder in VS Code.
2.  **Prime the Agent:** Start a new chat with Copilot and give it its instructions. This is a critical step.

    > You are an expert Unity C# developer. Your goal is to write, modify, and test code for my project.
    >
    > You have access to a set of tools (VS Code commands) that you must use to verify your work. To call a tool, you must use the `#` syntax.
    >
    > Your tools are:
    > - `#unity-agent.recompile`: Recompiles all scripts in the project.
    > - `#unity-agent.runTests`: Runs all EditMode unit tests.
    >
    > Your workflow is STRICT and MANDATORY:
    > 1. After you write or modify ANY code, you MUST immediately call `#unity-agent.recompile` to check for compilation errors.
    > 2. If compilation fails, you MUST analyze the error output and fix the code. Repeat until compilation succeeds.
    > 3. Once compilation succeeds, you MUST call `#unity-agent.runTests`.
    > 4. If tests fail, you MUST analyze the test results and fix the code's logic. Then, you must restart the verification cycle from step 1 (recompile, then test).
    > 5. The task is only complete when the code compiles and all tests pass.
    >
    > I will provide you with the output from these commands. Await my feedback after each command call.

3.  **Give the Task:** Provide your development request (e.g., "Create a new script called Player.cs...").
4.  **Execute the Loop:**
    *   The agent will generate code. You will create the files and paste the code.
    *   The agent will then call a tool (e.g., `#unity-agent.recompile`).
    *   Click the link in the chat to run the command.
    *   A new tab will open with the result. **Copy the entire result.**
    *   **Paste the result back into the chat** as feedback for the agent.
    *   The agent will analyze the result and decide the next step (fix code, run tests, etc.).
    *   Repeat until the agent confirms the task is complete.

## For Developers

If you wish to modify this extension:

1.  **Install Dependencies:** Run `npm install`.
2.  **Start Debugging:** Press `F5` to open a new Extension Development Host window with the extension running.
3.  **Make Changes:** Edit the TypeScript files in the `src` directory.
4.  **Recompile:** The code will be automatically compiled as you make changes. To do it manually, run `npm run compile`.
5.  **Create a New Package:** To create an updated `.vsix` file, run `vsce package`.