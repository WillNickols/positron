/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 by Lotas Inc.
 *  Licensed under the AGPL-3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Backend configuration interface
 */
export interface BackendConfig {
    url: string;
    environment: 'local' | 'production';
    timeout: number;
}

/**
 * Backend environment definitions
 */
export const BACKEND_ENVIRONMENTS = {
    local: {
        url: 'http://localhost:8080',
        name: 'Local Development'
    },
    production: {
        url: 'https://api.lotas.ai',
        name: 'Production'
    }
} as const;

/**
 * Health check response from backend
 */
export interface HealthResponse {
    status: 'UP' | 'DOWN';
    components?: Record<string, any>;
}

/**
 * Backend request for AI queries
 */
export interface BackendRequest {
    request_type: 'query' | 'function_call' | 'continuation';
    conversation: {
        messages: ConversationMessage[];
        system_prompt?: string;
    };
    provider: string;
    model: string;
    temperature: number;
    request_id: string;
    additional_data?: {
        attachments?: Attachment[];
        context?: ContextData;
        symbols?: string[];
        environment?: EnvironmentInfo;
    };
}

/**
 * Conversation message structure
 */
export interface ConversationMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    related_to?: number;
    original_query?: boolean;
    procedural?: boolean;
    function_call?: FunctionCall;
    timestamp: string;
}

/**
 * Function call structure
 */
export interface FunctionCall {
    name: string;
    arguments: Record<string, any>;
}

/**
 * Attachment structure
 */
export interface Attachment {
    file_path: string;
    file_name: string;
    file_size: number;
    file_type: string;
    upload_url?: string;
    attachment_id?: string;
}

/**
 * Context data structure
 */
export interface ContextData {
    files?: string[];
    directories?: string[];
    documentation?: Record<string, string>;
    conversations?: number[];
}

/**
 * Environment information
 */
export interface EnvironmentInfo {
    working_directory: string;
    open_files: string[];
    runtime: 'r' | 'python' | 'node';
}

/**
 * Backend response structure
 */
export interface BackendResponse {
    success: boolean;
    message?: string;
    error?: ErrorResponse;
    data?: any;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
    error_type: string;
    message: string;
    user_message?: string;
    action_required?: string;
}

/**
 * Streaming response chunk
 */
export interface StreamChunk {
    type: 'content' | 'function_call' | 'error' | 'done';
    content?: string;
    function_call?: FunctionCall;
    error?: ErrorResponse;
    choices?: Array<{
        delta?: {
            content?: string;
            function_call?: {
                name?: string;
                arguments?: string;
            };
        };
        finish_reason?: string;
    }>;
}

/**
 * Attachment upload response
 */
export interface AttachmentResponse {
    success: boolean;
    attachment_id?: string;
    upload_url?: string;
    error?: string;
}

/**
 * AI providers
 */
export type AIProvider = 'openai' | 'anthropic';

/**
 * Available models per provider - matches RAO exactly
 */
export const AVAILABLE_MODELS = {
    openai: ['gpt-5-mini'],
    anthropic: ['claude-sonnet-4-20250514']
} as const;

/**
 * Model display names - matches RAO exactly
 */
export const MODEL_DISPLAY_NAMES = {
    'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514 (Superior coding and analysis - recommended)',
    'gpt-5-mini': 'gpt-5-mini (Reasoning tier)'
} as const;

/**
 * Default models per provider
 */
export const DEFAULT_MODELS = {
    openai: 'gpt-5-mini',
    anthropic: 'claude-sonnet-4-20250514'
} as const;

/**
 * Timing constants - matches RAO exactly
 */
export const TIMING_CONFIG = {
    MAX_POLLING_ATTEMPTS: 3000,
    POLLING_SLEEP_MS: 100,
    ACTIVITY_TIMEOUT_MS: 30000,
    HEALTH_CHECK_TIMEOUTS_MS: [5000, 10000, 15000],
    RETRY_PAUSE_MS: 2000
} as const;

/**
 * Non-retryable error types - matches RAO exactly
 */
export const NON_RETRYABLE_ERROR_TYPES = [
    'SUBSCRIPTION_LIMIT_REACHED',
    'TRIAL_EXPIRED', 
    'PAYMENT_ACTION_REQUIRED',
    'USAGE_BILLING_REQUIRED',
    'USAGE_BILLING_LIMIT_REACHED',
    'SUBSCRIPTION_EXPIRED',
    'SUBSCRIPTION_PAYMENT_FAILED',
    'OVERAGE_PAYMENT_FAILED',
    'AUTHENTICATION_ERROR'
] as const;
