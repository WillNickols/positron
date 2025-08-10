/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 by Lotas Inc.
 *  Licensed under the AGPL-3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AIPaneProvider } from './webview/aiPaneProvider';
import { SettingsManager } from './settings/settingsManager';
import { APIKeyManager } from './settings/apiKeyManager';
import { BackendClient } from './api/backendClient';

/**
 * Extension activation function
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('Poisson AI extension is being activated');

    // Initialize core services
    const settingsManager = new SettingsManager(context);
    const apiKeyManager = new APIKeyManager(context);
    
    // Wire up dependencies
    settingsManager.setApiKeyManager(apiKeyManager);
    
    const backendClient = new BackendClient(settingsManager);
    
    // Initialize the AI pane provider
    const aiPaneProvider = new AIPaneProvider(context, settingsManager, apiKeyManager, backendClient);
    
    // Register the webview view provider
    const aiViewDisposable = vscode.window.registerWebviewViewProvider(
        'poissonAi',
        aiPaneProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );

    // Register commands
    const newConversationDisposable = vscode.commands.registerCommand(
        'poisson.ai.newConversation',
        () => aiPaneProvider.newConversation()
    );

    const sendMessageDisposable = vscode.commands.registerCommand(
        'poisson.ai.sendMessage',
        (message?: string) => aiPaneProvider.sendMessage(message)
    );

    const addFileContextDisposable = vscode.commands.registerCommand(
        'poisson.ai.addFileContext',
        (uri?: vscode.Uri) => aiPaneProvider.addFileContext(uri)
    );

    const clearContextDisposable = vscode.commands.registerCommand(
        'poisson.ai.clearContext',
        () => aiPaneProvider.clearContext()
    );

    const openSettingsDisposable = vscode.commands.registerCommand(
        'poisson.ai.openSettings',
        () => aiPaneProvider.openSettings()
    );

    const resetEnvironmentDisposable = vscode.commands.registerCommand(
        'poisson.ai.resetEnvironment',
        () => backendClient.resetEnvironment()
    );

    // Add all disposables to context
    context.subscriptions.push(
        aiViewDisposable,
        newConversationDisposable,
        sendMessageDisposable,
        addFileContextDisposable,
        clearContextDisposable,
        openSettingsDisposable,
        resetEnvironmentDisposable
    );

    console.log('Poisson AI extension activated successfully');
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate(): void {
    console.log('Poisson AI extension deactivated');
}
