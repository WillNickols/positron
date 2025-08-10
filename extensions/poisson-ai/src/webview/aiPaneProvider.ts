/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 by Lotas Inc.
 *  Licensed under the AGPL-3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { SettingsManager } from '../settings/settingsManager';
import { APIKeyManager } from '../settings/apiKeyManager';
import { BackendClient } from '../api/backendClient';

/**
 * Webview provider for the AI pane
 * Manages the lifecycle and communication with the webview
 */
export class AIPaneProvider implements vscode.WebviewViewProvider {
    private view?: vscode.WebviewView;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly settingsManager: SettingsManager,
        private readonly apiKeyManager: APIKeyManager,
        private readonly backendClient: BackendClient
    ) {}

    /**
     * Resolve the webview view - called when the view becomes visible
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.context.extensionUri
            ]
        };

        this.setupWebview();
        this.setupMessageHandling();
    }

    /**
     * Set up the initial webview content
     */
    private setupWebview(): void {
        if (!this.view) return;

        this.view.webview.html = this.getWebviewContent();
    }

    /**
     * Set up message handling between webview and extension
     */
    private setupMessageHandling(): void {
        if (!this.view) return;

        this.view.webview.onDidReceiveMessage(
            async (message) => {
                await this.handleWebviewMessage(message);
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * Handle messages from the webview
     */
    private async handleWebviewMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'sendMessage':
                await this.handleSendMessage(message.data);
                break;
            case 'checkBackendHealth':
                await this.handleCheckBackendHealth();
                break;
            case 'saveApiKey':
                await this.handleSaveApiKey(message.data);
                break;
            case 'getSettings':
                await this.handleGetSettings();
                break;
            default:
                console.warn('Unknown webview message command:', message.command);
        }
    }

    /**
     * Handle sending a message to the AI
     */
    private async handleSendMessage(data: { message: string }): Promise<void> {
        try {
            // TODO: Implement actual message sending in later phases
            this.postMessage({
                type: 'messageReceived',
                data: { message: `Echo: ${data.message}` }
            });
        } catch (error) {
            this.postMessage({
                type: 'error',
                data: { message: `Error: ${error}` }
            });
        }
    }

    /**
     * Handle backend health check
     */
    private async handleCheckBackendHealth(): Promise<void> {
        try {
            const isHealthy = await this.backendClient.checkHealth();
            this.postMessage({
                type: 'healthCheckResult',
                data: { healthy: isHealthy }
            });
        } catch (error) {
            this.postMessage({
                type: 'healthCheckResult',
                data: { healthy: false, error: error instanceof Error ? error.message : String(error) }
            });
        }
    }

    /**
     * Handle saving API key
     */
    private async handleSaveApiKey(data: { provider: string; key: string }): Promise<void> {
        try {
            await this.apiKeyManager.saveKey(data.provider, data.key);
            this.postMessage({
                type: 'apiKeySaved',
                data: { success: true }
            });
        } catch (error) {
            this.postMessage({
                type: 'apiKeySaved',
                data: { 
                    success: false, 
                    error: error instanceof Error ? error.message : String(error) 
                }
            });
        }
    }

    /**
     * Handle getting current settings
     */
    private async handleGetSettings(): Promise<void> {
        try {
            const activeProvider = this.settingsManager.getActiveProvider();
            const selectedModel = this.settingsManager.getSelectedModel(activeProvider);
            const availableModels = this.settingsManager.getAvailableModels(activeProvider);
            const hasApiKey = await this.apiKeyManager.hasKey(activeProvider);
            
            this.postMessage({
                type: 'settings',
                data: {
                    activeProvider,
                    selectedModel,
                    availableModels,
                    hasApiKey
                }
            });
        } catch (error) {
            this.postMessage({
                type: 'error',
                data: { message: `Error getting settings: ${error}` }
            });
        }
    }

    /**
     * Post a message to the webview
     */
    private postMessage(message: any): void {
        if (this.view) {
            this.view.webview.postMessage(message);
        }
    }

    /**
     * Generate the HTML content for the webview
     */
    private getWebviewContent(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Poisson AI</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 100%;
                }
                .input-section {
                    margin-bottom: 20px;
                }
                .message-input {
                    width: 100%;
                    min-height: 100px;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    resize: vertical;
                    font-family: inherit;
                }
                .button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                    margin-right: 8px;
                    margin-bottom: 8px;
                }
                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .status {
                    margin-top: 10px;
                    padding: 10px;
                    border-radius: 4px;
                }
                .status.success {
                    background-color: var(--vscode-testing-iconPassed);
                    color: white;
                }
                .status.error {
                    background-color: var(--vscode-testing-iconFailed);
                    color: white;
                }
                .messages {
                    margin-top: 20px;
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid var(--vscode-panel-border);
                    padding: 10px;
                }
                .message {
                    margin-bottom: 10px;
                    padding: 8px;
                    border-radius: 4px;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="input-section">
                    <textarea id="messageInput" class="message-input" placeholder="Ask the Poisson AI assistant anything..."></textarea>
                    <br>
                    <button id="sendButton" class="button">Send Message</button>
                    <button id="healthButton" class="button">Check Backend Health</button>
                    <button id="settingsButton" class="button">Get Settings</button>
                </div>
                
                <div id="status" class="status" style="display: none;"></div>
                
                <div id="messages" class="messages"></div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                // Get DOM elements
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const healthButton = document.getElementById('healthButton');
                const settingsButton = document.getElementById('settingsButton');
                const statusDiv = document.getElementById('status');
                const messagesDiv = document.getElementById('messages');

                // Handle send message
                sendButton.addEventListener('click', () => {
                    const message = messageInput.value.trim();
                    if (message) {
                        vscode.postMessage({
                            command: 'sendMessage',
                            data: { message }
                        });
                        messageInput.value = '';
                        addMessage('user', message);
                    }
                });

                // Handle health check
                healthButton.addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'checkBackendHealth'
                    });
                    showStatus('Checking backend health...', 'info');
                });

                // Handle get settings
                settingsButton.addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'getSettings'
                    });
                });

                // Handle Enter key in textarea
                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        sendButton.click();
                    }
                });

                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.type) {
                        case 'messageReceived':
                            addMessage('assistant', message.data.message);
                            break;
                        case 'healthCheckResult':
                            if (message.data.healthy) {
                                showStatus('Backend is healthy', 'success');
                            } else {
                                showStatus(\`Backend health check failed: \${message.data.error || 'Unknown error'}\`, 'error');
                            }
                            break;
                        case 'settings':
                            addMessage('system', \`Settings: Provider=\${message.data.activeProvider}, Model=\${message.data.selectedModel}, Has API Key=\${message.data.hasApiKey}\`);
                            break;
                        case 'error':
                            showStatus(message.data.message, 'error');
                            break;
                    }
                });

                function addMessage(role, content) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message';
                    messageDiv.innerHTML = \`<strong>\${role}:</strong> \${content}\`;
                    messagesDiv.appendChild(messageDiv);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }

                function showStatus(message, type) {
                    statusDiv.textContent = message;
                    statusDiv.className = \`status \${type}\`;
                    statusDiv.style.display = 'block';
                    
                    setTimeout(() => {
                        statusDiv.style.display = 'none';
                    }, 5000);
                }

                // Initialize
                addMessage('system', 'Poisson AI Assistant initialized. Backend environment detection will occur on first use.');
            </script>
        </body>
        </html>`;
    }

    // Command handlers for external calls
    public async newConversation(): Promise<void> {
        // TODO: Implement conversation management in later phases
        this.postMessage({
            type: 'info',
            data: { message: 'New conversation functionality coming soon' }
        });
    }

    public async sendMessage(message?: string): Promise<void> {
        if (message) {
            await this.handleSendMessage({ message });
        }
    }

    public async addFileContext(uri?: vscode.Uri): Promise<void> {
        // TODO: Implement file context in later phases
        this.postMessage({
            type: 'info', 
            data: { message: 'File context functionality coming soon' }
        });
    }

    public async clearContext(): Promise<void> {
        // TODO: Implement context management in later phases
        this.postMessage({
            type: 'info',
            data: { message: 'Clear context functionality coming soon' }
        });
    }

    public async openSettings(): Promise<void> {
        // TODO: Implement dedicated settings UI in later phases
        await this.handleGetSettings();
    }
}
