/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 by Lotas Inc.
 *  Licensed under the AGPL-3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AIProvider, AVAILABLE_MODELS, MODEL_DISPLAY_NAMES, DEFAULT_MODELS } from '../api/types';

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
    name: string;
    displayName: string;
    models: readonly string[];
    defaultModel: string;
    supportsFunctionCalling: boolean;
    supportsStreaming: boolean;
    supportsVision: boolean;
    maxTokens: number;
    temperatureRange: [number, number];
}

/**
 * Provider configurations - matches RAO capabilities exactly
 */
export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
    openai: {
        name: 'openai',
        displayName: 'OpenAI',
        models: AVAILABLE_MODELS.openai,
        defaultModel: DEFAULT_MODELS.openai,
        supportsFunctionCalling: true,
        supportsStreaming: true,
        supportsVision: true,
        maxTokens: 8192,
        temperatureRange: [0, 1]
    },
    anthropic: {
        name: 'anthropic',
        displayName: 'Anthropic',
        models: AVAILABLE_MODELS.anthropic,
        defaultModel: DEFAULT_MODELS.anthropic,
        supportsFunctionCalling: true,
        supportsStreaming: true,
        supportsVision: true,
        maxTokens: 8192,
        temperatureRange: [0, 1]
    }
};

/**
 * Provider configuration manager
 */
export class ProviderConfigManager {
    /**
     * Get configuration for a provider
     */
    public static getProviderConfig(provider: AIProvider): ProviderConfig {
        return PROVIDER_CONFIGS[provider];
    }

    /**
     * Get all provider configurations
     */
    public static getAllProviderConfigs(): Record<AIProvider, ProviderConfig> {
        return { ...PROVIDER_CONFIGS };
    }

    /**
     * Check if a model is valid for a provider
     */
    public static isValidModelForProvider(provider: AIProvider, model: string): boolean {
        const config = PROVIDER_CONFIGS[provider];
        return config.models.includes(model as any);
    }

    /**
     * Get model display name
     */
    public static getModelDisplayName(model: string): string {
        return MODEL_DISPLAY_NAMES[model as keyof typeof MODEL_DISPLAY_NAMES] || model;
    }

    /**
     * Get all available models across all providers
     */
    public static getAllAvailableModels(): string[] {
        return Object.values(PROVIDER_CONFIGS)
            .flatMap(config => [...config.models]);
    }

    /**
     * Get provider for a model
     */
    public static getProviderForModel(model: string): AIProvider | null {
        for (const [provider, config] of Object.entries(PROVIDER_CONFIGS)) {
            if (config.models.includes(model as any)) {
                return provider as AIProvider;
            }
        }
        return null;
    }

    /**
     * Validate temperature for provider
     */
    public static validateTemperature(provider: AIProvider, temperature: number): boolean {
        const config = PROVIDER_CONFIGS[provider];
        const [min, max] = config.temperatureRange;
        return temperature >= min && temperature <= max;
    }

    /**
     * Clamp temperature to valid range for provider
     */
    public static clampTemperature(provider: AIProvider, temperature: number): number {
        const config = PROVIDER_CONFIGS[provider];
        const [min, max] = config.temperatureRange;
        return Math.max(min, Math.min(max, temperature));
    }

    /**
     * Get provider capabilities
     */
    public static getProviderCapabilities(provider: AIProvider): {
        functionCalling: boolean;
        streaming: boolean;
        vision: boolean;
    } {
        const config = PROVIDER_CONFIGS[provider];
        return {
            functionCalling: config.supportsFunctionCalling,
            streaming: config.supportsStreaming,
            vision: config.supportsVision
        };
    }

    /**
     * Get recommended provider based on requirements
     */
    public static getRecommendedProvider(requirements: {
        functionCalling?: boolean;
        vision?: boolean;
        maxTokens?: number;
    }): AIProvider {
        const providers = Object.entries(PROVIDER_CONFIGS) as [AIProvider, ProviderConfig][];
        
        for (const [provider, config] of providers) {
            if (requirements.functionCalling && !config.supportsFunctionCalling) continue;
            if (requirements.vision && !config.supportsVision) continue;
            if (requirements.maxTokens && config.maxTokens < requirements.maxTokens) continue;
            
            return provider;
        }

        // Default to Anthropic (Claude) - matches RAO preference
        return 'anthropic';
    }

    /**
     * Get model metadata for UI display
     */
    public static getModelMetadata(model: string): {
        provider: AIProvider | null;
        displayName: string;
        capabilities: string[];
        isRecommended: boolean;
    } | null {
        const provider = this.getProviderForModel(model);
        if (!provider) return null;

        const config = PROVIDER_CONFIGS[provider];
        const capabilities: string[] = [];
        
        if (config.supportsFunctionCalling) capabilities.push('Function Calling');
        if (config.supportsStreaming) capabilities.push('Streaming');
        if (config.supportsVision) capabilities.push('Vision');

        return {
            provider,
            displayName: this.getModelDisplayName(model),
            capabilities,
            isRecommended: model === DEFAULT_MODELS.anthropic // Claude is recommended
        };
    }
}
