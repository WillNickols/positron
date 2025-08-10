/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 by Lotas Inc.
 *  Licensed under the AGPL-3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { 
    AIProvider, 
    AVAILABLE_MODELS, 
    MODEL_DISPLAY_NAMES, 
    DEFAULT_MODELS 
} from '../api/types';

/**
 * User automation settings - matches RAO exactly
 */
export interface AutomationSettings {
    auto_accept_edits: boolean;
    auto_accept_console: boolean;
    auto_accept_terminal: boolean;
    auto_run_files: boolean;
    auto_delete_files: boolean;
    auto_accept_console_allow_anything: boolean;
    auto_accept_terminal_allow_anything: boolean;
    auto_run_files_allow_anything: boolean;
    auto_accept_console_allow_list: string[];
    auto_accept_console_deny_list: string[];
    auto_accept_terminal_allow_list: string[];
    auto_accept_terminal_deny_list: string[];
    auto_run_files_allow_list: string[];
    auto_run_files_deny_list: string[];
}

/**
 * Settings manager for the AI extension
 * Handles all user preferences, provider configurations, and persistence
 */
export class SettingsManager {
    private static readonly STORAGE_KEYS = {
        SELECTED_MODEL: 'selectedModel',
        TEMPERATURE: 'temperature',
        USER_RULES: 'userRules',
        AUTOMATION_SETTINGS: 'automationSettings',
        WORKING_DIRECTORY: 'workingDirectory'
    } as const;

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * Get the active AI provider based on selected model
     */
    public getActiveProvider(): AIProvider {
        const model = this.getSelectedModel();
        return this.getProviderFromModel(model);
    }

    /**
     * Set the active provider (sets default model for that provider)
     */
    public setActiveProvider(provider: AIProvider): void {
        const defaultModel = DEFAULT_MODELS[provider];
        this.setSelectedModel(defaultModel);
    }

    /**
     * Get the selected model for a provider
     */
    public getSelectedModel(provider?: AIProvider): string {
        const storedModel = this.context.globalState.get<string>(
            SettingsManager.STORAGE_KEYS.SELECTED_MODEL
        );
        
        if (storedModel) {
            return storedModel;
        }

        // Default to Claude Sonnet 4 - matches RAO default
        return DEFAULT_MODELS.anthropic;
    }

    /**
     * Set the selected model
     */
    public setSelectedModel(model: string): void {
        this.context.globalState.update(SettingsManager.STORAGE_KEYS.SELECTED_MODEL, model);
    }

    /**
     * Get available models for a provider
     */
    public getAvailableModels(provider?: AIProvider): string[] {
        if (!provider) {
            // Return all available models if no provider specified
            return [...AVAILABLE_MODELS.anthropic, ...AVAILABLE_MODELS.openai];
        }
        
        return [...AVAILABLE_MODELS[provider]];
    }

    /**
     * Get model display names
     */
    public getModelDisplayNames(): Record<string, string> {
        return { ...MODEL_DISPLAY_NAMES };
    }

    /**
     * Get provider from model name - matches RAO logic exactly
     */
    public getProviderFromModel(model: string): AIProvider {
        if (AVAILABLE_MODELS.openai.includes(model as any)) {
            return 'openai';
        } else if (AVAILABLE_MODELS.anthropic.includes(model as any)) {
            return 'anthropic';
        } else {
            return 'openai'; // Default to OpenAI for unknown models - matches RAO
        }
    }

    /**
     * Get temperature setting
     */
    public getTemperature(): number {
        return this.context.globalState.get<number>(
            SettingsManager.STORAGE_KEYS.TEMPERATURE, 
            0.5 // Default temperature - matches RAO
        );
    }

    /**
     * Set temperature setting
     */
    public setTemperature(temperature: number): void {
        // Clamp temperature between 0 and 1
        const clampedTemp = Math.max(0, Math.min(1, temperature));
        this.context.globalState.update(SettingsManager.STORAGE_KEYS.TEMPERATURE, clampedTemp);
    }

    /**
     * Get backend URL override from VS Code configuration
     */
    public getBackendUrl(): string | undefined {
        const config = vscode.workspace.getConfiguration('poissonAi');
        return config.get<string>('backend.url') || undefined;
    }

    /**
     * Get backend environment setting from VS Code configuration
     */
    public getBackendEnvironment(): 'auto' | 'local' | 'production' {
        const config = vscode.workspace.getConfiguration('poissonAi');
        return config.get<'auto' | 'local' | 'production'>('backend.environment', 'auto');
    }

    /**
     * Get help font size from VS Code configuration
     */
    public getHelpFontSize(): number {
        const config = vscode.workspace.getConfiguration('poissonAi');
        return config.get<number>('ui.fontSize', 14);
    }

    /**
     * Get user rules
     */
    public getUserRules(): string[] {
        return this.context.globalState.get<string[]>(
            SettingsManager.STORAGE_KEYS.USER_RULES, 
            []
        );
    }

    /**
     * Set user rules
     */
    public setUserRules(rules: string[]): void {
        this.context.globalState.update(SettingsManager.STORAGE_KEYS.USER_RULES, rules);
    }

    /**
     * Get working directory
     */
    public getWorkingDirectory(): string {
        const stored = this.context.globalState.get<string>(
            SettingsManager.STORAGE_KEYS.WORKING_DIRECTORY
        );
        
        if (stored) {
            return stored;
        }

        // Default to first workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return workspaceFolders[0].uri.fsPath;
        }

        // Fallback to home directory
        return process.env.HOME || process.env.USERPROFILE || '/';
    }

    /**
     * Set working directory
     */
    public setWorkingDirectory(directory: string): void {
        this.context.globalState.update(SettingsManager.STORAGE_KEYS.WORKING_DIRECTORY, directory);
    }

    /**
     * Get automation settings - matches RAO structure exactly
     */
    public getAutomationSettings(): AutomationSettings {
        const defaultSettings: AutomationSettings = {
            auto_accept_edits: false,
            auto_accept_console: false,
            auto_accept_terminal: false,
            auto_run_files: false,
            auto_delete_files: false,
            auto_accept_console_allow_anything: false,
            auto_accept_terminal_allow_anything: false,
            auto_run_files_allow_anything: false,
            auto_accept_console_allow_list: [],
            auto_accept_console_deny_list: [],
            auto_accept_terminal_allow_list: [],
            auto_accept_terminal_deny_list: [],
            auto_run_files_allow_list: [],
            auto_run_files_deny_list: []
        };

        return this.context.globalState.get<AutomationSettings>(
            SettingsManager.STORAGE_KEYS.AUTOMATION_SETTINGS,
            defaultSettings
        );
    }

    /**
     * Set automation setting
     */
    public setAutomationSetting(key: keyof AutomationSettings, value: any): void {
        const currentSettings = this.getAutomationSettings();
        currentSettings[key] = value;
        this.context.globalState.update(SettingsManager.STORAGE_KEYS.AUTOMATION_SETTINGS, currentSettings);
    }

    /**
     * Get automation list (allow/deny lists)
     */
    public getAutomationList(listType: string): string[] {
        const settings = this.getAutomationSettings();
        const validListTypes = [
            'auto_accept_console_allow_list',
            'auto_accept_console_deny_list',
            'auto_accept_terminal_allow_list',
            'auto_accept_terminal_deny_list',
            'auto_run_files_allow_list',
            'auto_run_files_deny_list'
        ];

        if (validListTypes.includes(listType)) {
            return settings[listType as keyof AutomationSettings] as string[];
        }

        return [];
    }

    /**
     * Set automation list (allow/deny lists)
     */
    public setAutomationList(listType: string, items: string[]): void {
        const validListTypes = [
            'auto_accept_console_allow_list',
            'auto_accept_console_deny_list',
            'auto_accept_terminal_allow_list',
            'auto_accept_terminal_deny_list',
            'auto_run_files_allow_list',
            'auto_run_files_deny_list'
        ];

        if (validListTypes.includes(listType)) {
            this.setAutomationSetting(listType as keyof AutomationSettings, items);
        }
    }

    /**
     * Automation validation methods - matches RAO logic
     */
    public canAutoAcceptConsoleCommand(command: string): boolean {
        const settings = this.getAutomationSettings();
        
        if (!settings.auto_accept_console) {
            return false;
        }

        if (settings.auto_accept_console_allow_anything) {
            return !this.isInDenyList(command, settings.auto_accept_console_deny_list);
        }

        return this.isInAllowList(command, settings.auto_accept_console_allow_list);
    }

    /**
     * Check if command can auto-run files
     */
    public canAutoRunFile(filePath: string): boolean {
        const settings = this.getAutomationSettings();
        
        if (!settings.auto_run_files) {
            return false;
        }

        const expandedPath = this.expandTildePath(filePath);
        
        if (settings.auto_run_files_allow_anything) {
            return !this.isInDenyList(expandedPath, settings.auto_run_files_deny_list.map(p => this.expandTildePath(p)));
        }

        return this.isInAllowList(expandedPath, settings.auto_run_files_allow_list.map(p => this.expandTildePath(p)));
    }

    /**
     * Check if command can auto-accept terminal commands
     */
    public canAutoAcceptTerminalCommand(command: string): boolean {
        const settings = this.getAutomationSettings();
        
        if (!settings.auto_accept_terminal) {
            return false;
        }

        if (settings.auto_accept_terminal_allow_anything) {
            return !this.isInDenyList(command, settings.auto_accept_terminal_deny_list);
        }

        return this.isInAllowList(command, settings.auto_accept_terminal_allow_list);
    }

    /**
     * Check if item is in allow list
     */
    private isInAllowList(item: string, allowList: string[]): boolean {
        return allowList.some(pattern => this.matchesPattern(item, pattern));
    }

    /**
     * Check if item is in deny list
     */
    private isInDenyList(item: string, denyList: string[]): boolean {
        return denyList.some(pattern => this.matchesPattern(item, pattern));
    }

    /**
     * Pattern matching for automation lists
     */
    private matchesPattern(item: string, pattern: string): boolean {
        // Simple pattern matching - could be enhanced for wildcards if needed
        return item.includes(pattern) || pattern.includes(item);
    }

    /**
     * Expand tilde paths - matches RAO logic exactly
     */
    private expandTildePath(path: string): string {
        if (path.startsWith('~')) {
            const homeDir = process.env.HOME || process.env.USERPROFILE;
            if (homeDir) {
                return path.replace('~', homeDir);
            }
        }
        return path;
    }

    /**
     * Set API key manager reference for delegation
     */
    private apiKeyManager?: import('./apiKeyManager').APIKeyManager;
    
    public setApiKeyManager(apiKeyManager: import('./apiKeyManager').APIKeyManager): void {
        this.apiKeyManager = apiKeyManager;
    }

    /**
     * Get API key for provider - delegates to APIKeyManager
     */
    public async getApiKey(provider: string): Promise<string | null> {
        if (!this.apiKeyManager) {
            return null;
        }
        const key = await this.apiKeyManager.getKey(provider);
        return key || null;
    }

    /**
     * Get all settings as a consolidated object
     */
    public getAllSettings(): {
        activeProvider: AIProvider;
        selectedModel: string;
        availableModels: string[];
        temperature: number;
        userRules: string[];
        workingDirectory: string;
        automationSettings: AutomationSettings;
        helpFontSize: number;
    } {
        const activeProvider = this.getActiveProvider();
        
        return {
            activeProvider,
            selectedModel: this.getSelectedModel(),
            availableModels: this.getAvailableModels(activeProvider),
            temperature: this.getTemperature(),
            userRules: this.getUserRules(),
            workingDirectory: this.getWorkingDirectory(),
            automationSettings: this.getAutomationSettings(),
            helpFontSize: this.getHelpFontSize()
        };
    }
}
