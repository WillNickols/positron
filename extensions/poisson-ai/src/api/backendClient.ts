/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 by Lotas Inc.
 *  Licensed under the AGPL-3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fetch from 'node-fetch';
import FormData from 'form-data';
import { SettingsManager } from '../settings/settingsManager';
import {
	BackendConfig,
	BACKEND_ENVIRONMENTS,
	HealthResponse,
	BackendRequest,
	BackendResponse,
	StreamChunk,
	AttachmentResponse,
	TIMING_CONFIG,
	NON_RETRYABLE_ERROR_TYPES
} from './types';

/**
 * HTTP client for communicating with the RAO backend
 * Implements exact compatibility with the RAO backend protocol
 */
export class BackendClient {
	private config?: BackendConfig;
	private environmentChecked = false;

	constructor(private readonly settingsManager: SettingsManager) { }

	/**
	 * Detect the backend environment - matches RAO logic exactly
	 * Checks localhost:8080 first, falls back to production
	 */
	public async detectEnvironment(): Promise<BackendConfig> {
		// If environment was manually set, use that
		const manualUrl = this.settingsManager.getBackendUrl();
		if (manualUrl) {
			this.config = {
				url: manualUrl,
				environment: manualUrl.includes('localhost') ? 'local' : 'production',
				timeout: 30000,
			};
			this.environmentChecked = true;
			return this.config;
		}

		// Check if local backend is available - exact timeout match with RAO (3 seconds)
		let localAvailable = false;
		try {
			const response = await fetch(
				`${BACKEND_ENVIRONMENTS.local.url}/actuator/health`,
				{
					method: 'GET',
					timeout: 3000,
					headers: {
						'Accept': 'application/json',
					},
				},
			);
			localAvailable = response.status === 200;
		} catch (error) {
			localAvailable = false;
		}

		// Set environment based on local availability - matches RAO logic
		if (localAvailable) {
			this.config = {
				url: BACKEND_ENVIRONMENTS.local.url,
				environment: 'local',
				timeout: 30000,
			};
		} else {
			this.config = {
				url: BACKEND_ENVIRONMENTS.production.url,
				environment: 'production',
				timeout: 30000,
			};
		}

		this.environmentChecked = true;
		return this.config;
	}

	/**
	 * Get the current backend configuration
	 * Auto-detects environment if not already checked
	 */
	public async getBackendConfig(): Promise<BackendConfig> {
		if (!this.environmentChecked || !this.config) {
			return await this.detectEnvironment();
		}
		return this.config;
	}

	/**
	 * Reset environment detection to force re-detection
	 */
	public async resetEnvironment(): Promise<void> {
		this.environmentChecked = false;
		this.config = undefined;
		await this.detectEnvironment();
	}

	/**
	 * Check backend health with progressive retry logic
	 * Uses exact same timeouts and retry logic as RAO: 5s, 10s, 15s with 2s pauses
	 */
	public async checkHealth(): Promise<boolean> {
		const config = await this.getBackendConfig();

		// Progressive retry with increasing timeouts: 5s, 10s, 15s with 2s pauses
		for (let i = 0; i < TIMING_CONFIG.HEALTH_CHECK_TIMEOUTS_MS.length; i++) {
			const timeoutMs = TIMING_CONFIG.HEALTH_CHECK_TIMEOUTS_MS[i];

			try {
				const response = await fetch(`${config.url}/actuator/health`, {
					method: 'GET',
					timeout: timeoutMs,
					headers: {
						'Accept': 'application/json',
					},
				});

				if (response.status === 200) {
					const body = (await response.json()) as HealthResponse;
					if (body.status === 'UP') {
						return true;
					}
				}
			} catch (error) {
				// Continue to next attempt
			}

			// If not the last attempt, pause for 2 seconds before next try
			if (i < TIMING_CONFIG.HEALTH_CHECK_TIMEOUTS_MS.length - 1) {
				await this.sleep(TIMING_CONFIG.RETRY_PAUSE_MS);
			}
		}

		// All attempts failed
		return false;
	}

	/**
	 * Send a query to the backend
	 */
	public async sendQuery(request: BackendRequest): Promise<BackendResponse> {
		const config = await this.getBackendConfig();
		const apiKey = await this.getApiKey();

		if (!apiKey) {
			throw new Error('No API key found. Please set up a valid Rao API key.');
		}

		try {
			const response = await fetch(`${config.url}/api/ai/query`, {
				method: 'POST',
				timeout: config.timeout,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json',
				},
				body: JSON.stringify(request),
			});

			const responseData = (await response.json()) as BackendResponse;

			if (!response.ok) {
				throw new Error(
					responseData.error?.user_message ||
					responseData.message ||
					'Request failed',
				);
			}

			return responseData;
		} catch (error) {
			if (this.isRetryableError(error)) {
				// Could implement retry logic here if needed
			}
			throw error;
		}
	}

	/**
	 * Stream a query to the backend
	 * Returns an async iterator for processing streaming chunks
	 */
	public async *streamQuery(
		request: BackendRequest,
	): AsyncIterable<StreamChunk> {
		const config = await this.getBackendConfig();
		const apiKey = await this.getApiKey();

		if (!apiKey) {
			throw new Error('No API key found. Please set up a valid Rao API key.');
		}

		try {
			const response = await fetch(`${config.url}/api/ai/stream`, {
				method: 'POST',
				timeout: config.timeout,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'text/event-stream',
				},
				body: JSON.stringify(request),
			});

			if (!response.ok) {
				const errorData = (await response.json()) as BackendResponse;
				throw new Error(
					errorData.error?.user_message ||
					errorData.message ||
					'Stream request failed',
				);
			}

			if (!response.body) {
				throw new Error('No response body received');
			}

			// Parse SSE stream
			const decoder = new TextDecoder();
			const reader = (response.body as any).getReader();

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split('\n');

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const jsonData = line.substring(6); // Remove 'data: ' prefix
							if (jsonData.length > 0 && jsonData !== '[DONE]') {
								try {
									const parsed = JSON.parse(jsonData) as StreamChunk;
									yield parsed;
								} catch (parseError) {
									// Skip malformed JSON chunks
									console.warn('Failed to parse streaming chunk:', jsonData);
								}
							}
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		} catch (error) {
			if (this.isRetryableError(error)) {
				// Could implement retry logic here if needed
			}
			throw error;
		}
	}

	/**
	 * Upload an attachment to the backend
	 */
	public async uploadAttachment(
		fileBuffer: Buffer,
		fileName: string,
		provider: string,
	): Promise<AttachmentResponse> {
		const config = await this.getBackendConfig();
		const apiKey = await this.getApiKey();

		if (!apiKey) {
			throw new Error('No API key found. Please set up a valid Rao API key.');
		}

		const formData = new FormData();
		formData.append('file', fileBuffer, fileName);
		formData.append('provider', provider);

		try {
			const response = await fetch(`${config.url}/api/attachments/upload`, {
				method: 'POST',
				timeout: config.timeout,
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json',
					...formData.getHeaders(),
				},
				body: formData,
			});

			const responseData = (await response.json()) as AttachmentResponse;

			if (!response.ok) {
				throw new Error(responseData.error || 'Upload failed');
			}

			return responseData;
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Delete an attachment from the backend
	 */
	public async deleteAttachment(
		fileId: string,
		provider: string,
	): Promise<void> {
		const config = await this.getBackendConfig();
		const apiKey = await this.getApiKey();

		if (!apiKey) {
			throw new Error('No API key found. Please set up a valid Rao API key.');
		}

		try {
			const response = await fetch(`${config.url}/api/attachments/${fileId}`, {
				method: 'DELETE',
				timeout: config.timeout,
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = (await response.json()) as BackendResponse;
				throw new Error(errorData.error?.user_message || 'Delete failed');
			}
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Check if an error is retryable based on RAO logic
	 */
	private isRetryableError(error: any): boolean {
		if (error?.error?.error_type) {
			return !NON_RETRYABLE_ERROR_TYPES.includes(error.error.error_type);
		}
		return true; // Default to retryable
	}

	/**
	 * Get API key from settings manager
	 */
	private async getApiKey(): Promise<string | null> {
		const activeProvider = this.settingsManager.getActiveProvider();
		// RAO uses a single 'rao' API key for all providers
		return await this.settingsManager.getApiKey('rao');
	}

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
