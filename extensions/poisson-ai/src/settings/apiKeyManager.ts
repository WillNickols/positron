/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 by Lotas Inc.
 *  Licensed under the AGPL-3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

/**
 * API key manager for secure storage and retrieval
 * Uses VS Code's secret storage for secure key management
 */
export class APIKeyManager {
    private static readonly SECRET_KEYS = {
        RAO_API_KEY: 'poissonAi.raoApiKey'
    } as const;

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Save API key securely - matches RAO logic exactly
     * RAO accepts both "rao" and "openai" provider names for compatibility
     */
    public async saveKey(provider: string, key: string): Promise<void> {
        try {
            if (provider === 'rao' || provider === 'openai') {
                // Store using VS Code's secure secret storage
                await this.context.secrets.store(APIKeyManager.SECRET_KEYS.RAO_API_KEY, key);
                
                // Show success message
                vscode.window.showInformationMessage('Rao API key saved successfully');
            } else {
                throw new Error(`Unsupported provider: ${provider}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to save API key: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Get API key - matches RAO lookup logic exactly
     * Checks secret storage first, then environment variable fallback
     */
    public async getKey(provider: string): Promise<string | undefined> {
        try {
            if (provider === 'rao' || provider === 'openai') {
                // Check secret storage first
                const storedKey = await this.context.secrets.get(APIKeyManager.SECRET_KEYS.RAO_API_KEY);
                
                if (storedKey && storedKey.length > 0) {
                    return storedKey;
                }

                // Fallback to environment variable - matches RAO exactly
                const envKey = process.env.RAO_API_KEY;
                return (envKey && envKey.length > 0) ? envKey : undefined;
            }
            
            return undefined;
        } catch (error) {
            console.error('Error retrieving API key:', error);
            return undefined;
        }
    }

    /**
     * Delete API key - matches RAO logic exactly
     */
    public async deleteKey(provider: string): Promise<void> {
        try {
            if (provider === 'rao' || provider === 'openai') {
                await this.context.secrets.delete(APIKeyManager.SECRET_KEYS.RAO_API_KEY);
                vscode.window.showInformationMessage('Rao API key deleted successfully');
            } else {
                throw new Error(`Unsupported provider: ${provider}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to delete API key: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Check if API key exists for provider
     */
    public async hasKey(provider: string): Promise<boolean> {
        try {
            const key = await this.getKey(provider);
            return key !== undefined && key.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate API key format
     * Basic validation - could be enhanced with provider-specific checks
     */
    public validateKeyFormat(provider: string, key: string): boolean {
        if (!key || key.length === 0) {
            return false;
        }

        // Basic length check - API keys should be reasonably long
        if (key.length < 10) {
            return false;
        }

        // Check for common invalid values
        const invalidValues = ['', 'undefined', 'null', 'your-key-here', 'api-key'];
        if (invalidValues.includes(key.toLowerCase())) {
            return false;
        }

        return true;
    }

    /**
     * OAuth flow starter - placeholder for future implementation
     * RAO doesn't currently use OAuth but this provides extensibility
     */
    public async startOAuthFlow(provider: string): Promise<string> {
        throw new Error('OAuth flow not implemented yet');
    }

    /**
     * OAuth callback handler - placeholder for future implementation
     */
    public async handleOAuthCallback(code: string): Promise<void> {
        throw new Error('OAuth callback not implemented yet');
    }

    /**
     * Test API key by making a minimal backend call
     */
    public async testKey(provider: string): Promise<boolean> {
        try {
            const key = await this.getKey(provider);
            if (!key) {
                return false;
            }

            // TODO: In later phases, test the key by making a health check to backend
            // For now, just validate format
            return this.validateKeyFormat(provider, key);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get key status information
     */
    public async getKeyStatus(provider: string): Promise<{
        hasKey: boolean;
        isValid: boolean;
        source: 'storage' | 'environment' | 'none';
    }> {
        try {
            // Check secret storage first
            const storedKey = await this.context.secrets.get(APIKeyManager.SECRET_KEYS.RAO_API_KEY);
            if (storedKey && storedKey.length > 0) {
                return {
                    hasKey: true,
                    isValid: this.validateKeyFormat(provider, storedKey),
                    source: 'storage'
                };
            }

            // Check environment variable
            const envKey = process.env.RAO_API_KEY;
            if (envKey && envKey.length > 0) {
                return {
                    hasKey: true,
                    isValid: this.validateKeyFormat(provider, envKey),
                    source: 'environment'
                };
            }

            return {
                hasKey: false,
                isValid: false,
                source: 'none'
            };
        } catch (error) {
            return {
                hasKey: false,
                isValid: false,
                source: 'none'
            };
        }
    }

    /**
     * Prompt user to enter API key
     */
    public async promptForKey(provider: string): Promise<string | undefined> {
        const key = await vscode.window.showInputBox({
            prompt: `Enter your Rao API key for ${provider} provider`,
            placeHolder: 'rao-...',
            password: true,
            validateInput: (value) => {
                if (!this.validateKeyFormat(provider, value)) {
                    return 'Please enter a valid API key';
                }
                return undefined;
            }
        });

        if (key) {
            await this.saveKey(provider, key);
        }

        return key;
    }
}
