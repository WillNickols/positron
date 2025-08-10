# RAO AI to Positron Extension - Pure TypeScript Implementation Plan

## Overview
Implement the complete RAO AI functionality as a Positron VS Code extension using only TypeScript, maintaining exact compatibility with the rao-backend protocol.

## Architecture

### 1. Extension Structure
```
positron-ai/
├── package.json
├── src/
│   ├── extension.ts                    // Main entry point
│   ├── api/
│   │   ├── backendClient.ts          // HTTP client for rao-backend
│   │   ├── streamingParser.ts        // SSE stream parser
│   │   ├── types.ts                  // TypeScript interfaces matching backend protocol
│   │   └── providers/
│   │       ├── openai.ts             // OpenAI-specific handling
│   │       ├── anthropic.ts          // Anthropic-specific handling
│   │       └── base.ts               // Base provider interface
│   ├── conversation/
│   │   ├── conversationManager.ts    // Conversation state management
│   │   ├── messageStore.ts           // Message persistence
│   │   ├── conversationTypes.ts      // Conversation data structures
│   │   └── history.ts                // Conversation history management
│   ├── webview/
│   │   ├── aiPaneProvider.ts         // Main webview provider
│   │   ├── messageHandler.ts         // Webview <-> extension messaging
│   │   └── resourceLoader.ts         // Load webview resources
│   ├── widgets/
│   │   ├── widgetManager.ts          // Widget lifecycle management
│   │   ├── editFileWidget.ts         // File editing widget
│   │   ├── consoleWidget.ts          // Console output widget
│   │   ├── terminalWidget.ts         // Terminal command widget
│   │   ├── searchReplaceWidget.ts    // Search/replace widget
│   │   └── baseWidget.ts             // Base widget class
│   ├── functions/
│   │   ├── functionCallHandler.ts    // AI function call processor
│   │   ├── fileOperations.ts         // File editing functions
│   │   ├── searchOperations.ts       // Code search functions
│   │   ├── consoleOperations.ts      // Console execution
│   │   └── terminalOperations.ts     // Terminal execution
│   ├── context/
│   │   ├── contextManager.ts         // File/folder context management
│   │   ├── symbolExtractor.ts        // Extract symbols from code
│   │   └── documentationContext.ts   // Documentation context
│   ├── attachments/
│   │   ├── attachmentManager.ts      // File attachment handling
│   │   ├── imageProcessor.ts         // Image resize/compression
│   │   └── storage.ts                // Attachment persistence
│   ├── settings/
│   │   ├── settingsManager.ts        // User preferences
│   │   ├── apiKeyManager.ts          // Secure API key storage
│   │   └── providerConfig.ts         // Provider configurations
│   ├── ui/
│   │   ├── streamingDisplay.ts       // Streaming message renderer
│   │   ├── markdownRenderer.ts       // Custom markdown rendering
│   │   ├── syntaxHighlighter.ts      // Code syntax highlighting
│   │   └── buttonStateManager.ts     // Interactive button states
│   └── utils/
│       ├── diff.ts                   // Line diff algorithm
│       ├── fileSystem.ts             // File system utilities
│       ├── commentSyntax.ts          // Language comment syntax
│       └── errorHandling.ts          // Error recovery
├── webview-ui/                         // React app for webview
│   ├── src/
│   │   ├── App.tsx                   // Main React component
│   │   ├── components/
│   │   │   ├── ConversationView.tsx  // Main conversation display
│   │   │   ├── StreamingMessage.tsx  // Streaming message component
│   │   │   ├── CodeBlock.tsx         // Code block with actions
│   │   │   ├── Widget.tsx            // Widget container
│   │   │   └── Settings.tsx          // Settings panel
│   │   ├── hooks/
│   │   │   ├── useStreaming.ts       // Streaming state management
│   │   │   └── useVSCodeApi.ts       // VS Code API wrapper
│   │   └── styles/
│   │       └── main.css              // Webview styles
│   ├── build/                        // Compiled webview assets
│   └── tsconfig.json
└── resources/
    └── icons/
```

### 2. Backend Protocol Implementation

#### 2.1 Backend Client (`backendClient.ts`)
```typescript
interface BackendConfig {
  url: string;
  environment: 'local' | 'production';
  timeout: number;
}

class RaoBackendClient {
  async detectEnvironment(): Promise<BackendConfig>
  async sendQuery(request: BackendRequest): Promise<BackendResponse>
  async streamQuery(request: BackendRequest): AsyncIterable<StreamChunk>
  async uploadAttachment(file: File, provider: string): Promise<AttachmentResponse>
  async deleteAttachment(fileId: string, provider: string): Promise<void>
  async checkHealth(): Promise<HealthResponse>
}
```

#### 2.2 Streaming Parser (`streamingParser.ts`)
```typescript
class SSEParser {
  parse(chunk: string): ParsedEvent[]
  handleDataLine(line: string): StreamData
  extractFunctionCall(data: any): FunctionCall | null
  bufferPartialJSON(partial: string): void
}

interface StreamData {
  type: 'content' | 'function_call' | 'error' | 'done';
  content?: string;
  functionCall?: FunctionCall;
  error?: ErrorInfo;
}
```

### 3. Core Components

#### 3.1 Conversation Manager (`conversationManager.ts`)
```typescript
class ConversationManager {
  // Lifecycle
  createNewConversation(): ConversationInfo
  loadConversation(id: number): Conversation
  switchConversation(id: number): void
  deleteConversation(id: number): void
  
  // Messaging
  addUserMessage(content: string, attachments?: Attachment[]): Message
  addAssistantMessage(content: string, metadata?: MessageMetadata): Message
  streamAssistantMessage(requestId: string): StreamingMessage
  
  // Persistence
  saveConversation(conversation: Conversation): void
  getConversationPath(id: number): string
  
  // Naming
  generateConversationName(id: number): Promise<string>
  setConversationName(id: number, name: string): void
  shouldPromptForName(): boolean
}
```

#### 3.2 Message Store (`messageStore.ts`)
```typescript
class MessageStore {
  private messages: Map<string, Message>;
  private messageOrder: string[];
  private diffData: Map<string, DiffData>;
  
  addMessage(message: Message): string
  updateMessage(id: string, updates: Partial<Message>): void
  getNextMessageId(): string
  storeDiff(messageId: string, diff: DiffData): void
  revertMessage(messageId: string): void
}
```

### 4. Widget System

#### 4.1 Base Widget (`baseWidget.ts`)
```typescript
abstract class BaseWidget {
  id: string;
  messageId: string;
  type: WidgetType;
  state: WidgetState;
  
  abstract render(): WidgetHTML;
  abstract handleAction(action: string, data: any): Promise<void>;
  
  updateState(newState: Partial<WidgetState>): void
  sendToWebview(command: string, data: any): void
}
```

#### 4.2 Edit File Widget (`editFileWidget.ts`)
```typescript
class EditFileWidget extends BaseWidget {
  filePath: string;
  originalContent: string;
  newContent: string;
  diff: LineDiff[];
  
  async accept(): Promise<void> {
    // Apply file changes
    // Continue AI workflow
    // Update conversation
  }
  
  async reject(): Promise<void> {
    // Mark as rejected
    // Continue workflow with rejection
  }
  
  computeDiff(): LineDiff[]
  applyEdit(): Promise<void>
}
```

#### 4.3 Console Widget (`consoleWidget.ts`)
```typescript
class ConsoleWidget extends BaseWidget {
  code: string;
  language: 'r' | 'python';
  output?: string;
  
  async execute(): Promise<void> {
    // Execute in appropriate runtime
    // Capture output
    // Continue workflow with results
  }
  
  connectToRuntime(): RuntimeConnection
  captureOutput(): Promise<string>
}
```

#### 4.4 Terminal Widget (`terminalWidget.ts`)
```typescript
class TerminalWidget extends BaseWidget {
  command: string;
  workingDirectory: string;
  terminal?: vscode.Terminal;
  
  async execute(): Promise<void> {
    // Create or reuse terminal
    // Execute command
    // Monitor completion
  }
  
  createTerminal(): vscode.Terminal
  monitorCompletion(): Promise<TerminalResult>
}
```

### 5. Function Call System

#### 5.1 Function Call Handler (`functionCallHandler.ts`)
```typescript
class FunctionCallHandler {
  private handlers: Map<string, FunctionHandler>;
  
  registerHandler(name: string, handler: FunctionHandler): void
  
  async processFunctionCall(call: FunctionCall, context: CallContext): Promise<FunctionResult> {
    const handler = this.handlers.get(call.name);
    if (!handler) throw new Error(`Unknown function: ${call.name}`);
    
    const result = await handler.execute(call.arguments, context);
    return this.formatResult(result, call);
  }
  
  // Built-in handlers
  registerBuiltinHandlers(): void {
    this.registerHandler('edit_file', new EditFileHandler());
    this.registerHandler('find_keyword_context', new SearchHandler());
    this.registerHandler('run_console_command', new ConsoleHandler());
    this.registerHandler('run_terminal_command', new TerminalHandler());
    this.registerHandler('view_image', new ImageHandler());
  }
}
```

#### 5.2 File Operations (`fileOperations.ts`)
```typescript
class EditFileHandler implements FunctionHandler {
  async execute(args: EditFileArgs, context: CallContext): Promise<FunctionResult> {
    const { file_path, new_content } = args;
    
    // Create edit widget
    const widget = new EditFileWidget(file_path, new_content);
    context.widgetManager.addWidget(widget);
    
    // Return widget display
    return {
      type: 'widget',
      widgetId: widget.id,
      content: widget.render()
    };
  }
}
```

### 6. Context Management

#### 6.1 Context Manager (`contextManager.ts`)
```typescript
class ContextManager {
  private contextItems: Map<string, ContextItem>;
  
  addFile(path: string): boolean
  addDirectory(path: string, recursive: boolean): boolean
  addLines(path: string, startLine: number, endLine: number): boolean
  addDocumentation(topic: string, content: string): boolean
  addConversation(conversationId: number): boolean
  
  getContextForRequest(): ContextData
  removeItem(pathOrId: string): boolean
  clear(): void
}
```

#### 6.2 Symbol Extractor (`symbolExtractor.ts`)
```typescript
class SymbolExtractor {
  async extractFromCode(code: string, language: string): Promise<Symbol[]>
  async findUndefinedSymbols(code: string, context: RuntimeContext): Promise<string[]>
  
  // Language-specific parsers
  parseRCode(code: string): Symbol[]
  parsePythonCode(code: string): Symbol[]
  parseJavaScriptCode(code: string): Symbol[]
}
```

### 7. Attachment System

#### 7.1 Attachment Manager (`attachmentManager.ts`)
```typescript
class AttachmentManager {
  private attachments: Map<string, Attachment>;
  private csvPath: string;
  
  async addAttachment(filePath: string): Promise<Attachment>
  async uploadToBackend(attachment: Attachment): Promise<string>
  listAttachments(): Attachment[]
  deleteAttachment(filePath: string): Promise<void>
  deleteAll(): Promise<void>
  
  // Provider-specific handling
  handleAnthropicAttachment(file: File): Promise<string>
  handleOpenAIAttachment(file: File): Promise<string>
}
```

#### 7.2 Image Processor (`imageProcessor.ts`)
```typescript
class ImageProcessor {
  async processForAI(imagePath: string, maxSizeKB: number = 500): Promise<ProcessedImage>
  async resizeImage(buffer: Buffer, maxDimension: number): Promise<Buffer>
  async compressImage(buffer: Buffer, quality: number): Promise<Buffer>
  checkDuplicate(imagePath: string): Promise<boolean>
}
```

### 8. Settings and Configuration

#### 8.1 Settings Manager (`settingsManager.ts`)
```typescript
interface AutomationSettings {
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

class SettingsManager {
  getActiveProvider(): AIProvider
  setActiveProvider(provider: AIProvider): void
  getSelectedModel(provider: AIProvider): string
  setSelectedModel(provider: AIProvider, model: string): void
  getAvailableModels(provider: AIProvider): string[]
  
  // User preferences
  getHelpFontSize(): number
  getUserRules(): string[]
  setUserRules(rules: string[]): void
  
  // Automation settings
  getAutomationSettings(): AutomationSettings
  setAutomationSetting(key: keyof AutomationSettings, value: any): void
  getAutomationList(listType: string): string[]
  setAutomationList(listType: string, items: string[]): void
  
  // Automation validation
  canAutoAcceptConsoleCommand(command: string): boolean
  canAutoRunFile(filePath: string): boolean
  canAutoAcceptTerminalCommand(command: string): boolean
}
```

#### 8.2 API Key Manager (`apiKeyManager.ts`)
```typescript
class APIKeyManager {
  async saveKey(provider: string, key: string): Promise<void>
  async getKey(provider: string): Promise<string | undefined>
  async deleteKey(provider: string): Promise<void>
  
  // OAuth flow
  async startOAuthFlow(provider: string): Promise<string>
  async handleOAuthCallback(code: string): Promise<void>
}
```

### 9. UI Components

#### 9.1 Streaming Display (`streamingDisplay.ts`)
```typescript
class StreamingDisplay {
  private activeStream?: StreamingMessage;
  private buffer: string = '';
  
  startStreaming(messageId: string): void
  appendContent(content: string): void
  finalizeStream(): void
  
  renderMarkdown(content: string): string
  highlightCode(code: string, language: string): string
  injectButtons(html: string, messageId: string): string
}
```

#### 9.2 Button State Manager (`buttonStateManager.ts`)
```typescript
class ButtonStateManager {
  private buttonStates: Map<string, ButtonState>;
  
  registerButton(messageId: string, buttonType: string): string
  markAsRun(messageId: string, buttonType: string): void
  shouldHideButton(messageId: string, buttonType: string): boolean
  clearAfterMessage(messageId: string): void
  
  persistStates(): void
  loadStates(): void
}
```

### 10. Webview Implementation

#### 10.1 AI Pane Provider (`aiPaneProvider.ts`)
```typescript
class AIPaneProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private conversationManager: ConversationManager;
  private widgetManager: WidgetManager;
  
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    this.setupWebview();
    this.setupMessageHandling();
  }
  
  private handleWebviewMessage(message: WebviewMessage): void {
    switch (message.command) {
      case 'sendMessage':
        this.handleSendMessage(message.data);
        break;
      case 'widgetAction':
        this.handleWidgetAction(message.data);
        break;
      // ... other commands
    }
  }
}
```

#### 10.2 React Components

```typescript
// ConversationView.tsx
const ConversationView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const vscode = useVSCodeAPI();
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'streamData') {
        updateStreamingMessage(event.data);
      }
    };
    window.addEventListener('message', handleMessage);
  }, []);
  
  return (
    <div className="conversation-container">
      {messages.map(msg => (
        <MessageComponent key={msg.id} message={msg} />
      ))}
    </div>
  );
};
```

### 11. Document Operations

#### 11.1 Document Manager (`documentManager.ts`)
```typescript
class DocumentManager {
  // Document retrieval
  async getAllOpenDocuments(includeContents: boolean = true): Promise<DocumentInfo[]>
  async getActiveDocument(): Promise<DocumentInfo | null>
  
  // Document manipulation
  async updateOpenDocumentContent(documentId: string, newContent: string): Promise<boolean>
  async matchTextInOpenDocuments(searchText: string, options?: MatchOptions): Promise<MatchResult[]>
  
  // Document state management
  isDocumentSaved(documentId: string): boolean
  getDocumentPath(documentId: string): string
  createSyntheticPath(document: DocumentInfo): string // For unsaved files
  
  // Content utilities
  getEffectiveFileContent(filePath: string, startLine?: number, endLine?: number): Promise<string>
  checkIfFileOpenInEditor(filePath: string): boolean
}

interface DocumentInfo {
  id: string;
  path: string;
  contents: string;
  isActive: boolean;
  isSaved: boolean;
  metadata: {
    timestamp: string;
    lineCount: number;
    language: string;
  };
}

interface MatchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

interface MatchResult {
  documentId: string;
  documentPath: string;
  line: number;
  column: number;
  matchText: string;
  contextBefore: string;
  contextAfter: string;
}
```

### 12. Protocol Compatibility

#### 11.1 Backend Request Format
```typescript
interface BackendRequest {
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
```

#### 11.2 Streaming Response Format
```typescript
interface StreamingResponse {
  // SSE format: "data: {json}\n\n"
  choices?: [{
    delta?: {
      content?: string;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason?: string;
  }];
  error?: {
    message: string;
    type: string;
  };
}
```

### 13. Automation System

#### 13.1 Automation Engine (`automationEngine.ts`)
```typescript
class AutomationEngine {
  private settingsManager: SettingsManager;
  
  // Main automation decision methods
  async shouldAutoAcceptEdit(filePath: string): Promise<boolean>
  async shouldAutoAcceptConsoleCommand(command: string): Promise<boolean>
  async shouldAutoAcceptTerminalCommand(command: string): Promise<boolean>
  async shouldAutoRunFile(filePath: string): Promise<boolean>
  
  // Validation helpers
  private validateAgainstAllowList(item: string, allowList: string[]): boolean
  private validateAgainstDenyList(item: string, denyList: string[]): boolean
  private extractFunctionsFromCommand(command: string): string[]
  private expandTildePaths(paths: string[]): string[]
  
  // Auto-execution methods
  async autoAcceptEditFile(messageId: string, newContent: string, filePath: string): Promise<void>
  async autoAcceptConsoleCommand(messageId: string, command: string): Promise<void>
  async autoAcceptTerminalCommand(messageId: string, command: string): Promise<void>
  
  // Configuration validation
  validateAutomationSettings(): ValidationResult
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}
```


### 14. Error Handling and Recovery

```typescript
class ErrorHandler {
  async handleAPIError(error: any, context: ErrorContext): Promise<ErrorRecovery> {
    if (this.isRetryable(error)) {
      return this.retryWithBackoff(context);
    }
    
    if (this.isAuthError(error)) {
      return this.promptForAuth(context);
    }
    
    return this.showUserError(error, context);
  }
  
  private retryWithBackoff(context: ErrorContext): ErrorRecovery {
    const delay = Math.min(1000 * Math.pow(2, context.attempt), 30000);
    return { action: 'retry', delay };
  }
}
```

### 15. Extension Commands

```json
{
  "contributes": {
    "commands": [
      {
        "command": "positron.ai.newConversation",
        "title": "AI: New Conversation"
      },
      {
        "command": "positron.ai.sendMessage",
        "title": "AI: Send Message"
      },
      {
        "command": "positron.ai.addFileContext",
        "title": "AI: Add File to Context"
      },
      {
        "command": "positron.ai.clearContext",
        "title": "AI: Clear Context"
      },
      {
        "command": "positron.ai.openSettings",
        "title": "AI: Open Settings"
      }
    ],
    "keybindings": [
      {
        "command": "positron.ai.sendMessage",
        "key": "ctrl+enter",
        "when": "focusedView == positron.aiView"
      }
    ]
  }
}
```

### 16. Additional Function Handlers

#### 16.1 Advanced Function Handlers
```typescript
// Additional function handlers found in RAO that were missing
class AdvancedFunctionHandlers {
  // File system operations
  async handleReadFile(args: ReadFileArgs): Promise<FunctionResult>
  async handleSearchForFile(args: SearchFileArgs): Promise<FunctionResult>
  async handleListDirectory(args: ListDirArgs): Promise<FunctionResult>
  async handleDeleteFile(args: DeleteFileArgs): Promise<FunctionResult>
  async handleRunFile(args: RunFileArgs): Promise<FunctionResult>
  
  // Search operations
  async handleGrepSearch(args: GrepSearchArgs): Promise<FunctionResult>
  async handleWebSearch(args: WebSearchArgs): Promise<FunctionResult>
  async handleSearchReplace(args: SearchReplaceArgs): Promise<FunctionResult>
  
  // Advanced content operations
  async filterEditedCodeUsingDiffData(editedCode: string, messageId: string): Promise<string>
  async generateFunctionCallMessage(functionName: string, args: any, isThinking: boolean): Promise<string>
  
  // Function call management
  findFunctionCallByCallId(conversationLog: ConversationEntry[], callId: string): ConversationEntry | null
  findFunctionCallByMessageId(conversationLog: ConversationEntry[], messageId: string): ConversationEntry | null
  extractCommandAndExplanation(functionCallEntry: ConversationEntry, functionResult?: any): { command: string, explanation: string }
}

interface ReadFileArgs {
  filename: string;
  start_line_one_indexed?: number;
  end_line_one_indexed_inclusive?: number;
  should_read_entire_file?: boolean;
}

interface SearchFileArgs {
  query: string;
}

interface ListDirArgs {
  relative_workspace_path: string;
}

interface DeleteFileArgs {
  filename: string;
  explanation?: string;
}

interface RunFileArgs {
  filename: string;
  start_line_one_indexed?: number;
  end_line_one_indexed_inclusive?: number;
  explanation?: string;
}

interface GrepSearchArgs {
  query: string;
  include_pattern?: string;
  exclude_pattern?: string;
}

interface WebSearchArgs {
  query: string;
}

interface SearchReplaceArgs {
  file_path: string;
  search_text: string;
  replace_text: string;
}
```

#### 16.2 Message and Widget State Management
```typescript
class MessageStateManager {
  // Assistant message limits
  checkAssistantMessageLimit(): { exceeded: boolean, count: number, limit: number }
  incrementAssistantMessageCount(): number
  resetAssistantMessageCount(): void
  
  // Function call state
  isApiResponseFunctionCall(response: any): boolean
  createFunctionCallWidgetOperation(functionCallEntry: any, functionResult?: any): WidgetOperation | null
  
  // Message ID management
  preallocateFunctionMessageIds(functionName: string, callId: string): void
  getPreallocatedMessageId(callId: string, index: number): string
  isFirstFunctionCallInParallelSet(callId: string): boolean
  getFunctionMessageIdCount(functionName: string): number
}
```

### 17. Data Storage

```typescript
class StorageManager {
  // Use VS Code's storage APIs
  private globalState: vscode.Memento;
  private workspaceState: vscode.Memento;
  private secrets: vscode.SecretStorage;
  
  // Conversation storage
  getConversationDir(): string {
    return path.join(this.context.globalStorageUri.fsPath, 'conversations');
  }
  
  // Attachment storage
  getAttachmentDir(): string {
    return path.join(this.context.globalStorageUri.fsPath, 'attachments');
  }
}
```


### 18. Critical Implementation Details

These are the essential low-level implementation details that MUST be reproduced exactly for compatibility:

#### 18.1 Streaming Response Parsing (CRITICAL)
```typescript
// RAO uses a 20-character buffer to prevent incomplete streaming
const BUFFER_SIZE = 20;

function extractStreamContent(accumulated: string, currentStreamed: string): { 
  content: string, 
  endReached: boolean 
} {
  const endMarkerPattern = /\s*"\s*,\s*"instructions"/;
  const endMatch = accumulated.match(endMarkerPattern);
  
  if (endMatch && endMatch.index !== undefined) {
    return {
      content: accumulated.substring(0, endMatch.index),
      endReached: true
    };
  } else if (accumulated.length > BUFFER_SIZE) {
    return {
      content: accumulated.substring(0, accumulated.length - BUFFER_SIZE),
      endReached: false
    };
  } else {
    return {
      content: "",
      endReached: false
    };
  }
}
```

#### 18.2 SSE Protocol Parsing (EXACT FORMAT REQUIRED)
```typescript
class SSEParser {
  parseSSELine(line: string): { type: string, data: any } | null {
    if (line.startsWith("data: ")) {
      const jsonData = line.substring(7); // Exactly 7 characters
      if (jsonData.length > 0 && jsonData !== "[DONE]") {
        try {
          return {
            type: "EVENT",
            data: JSON.parse(jsonData)
          };
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }
}
```

#### 18.3 Message ID Management (SEQUENTIAL INTEGERS)
```typescript
class MessageManager {
  private messageIdCounter = 0;
  
  getNextMessageId(): number {
    this.messageIdCounter += 1;
    return this.messageIdCounter;
  }
  
  createMessage(role: 'user' | 'assistant', content: string, relatedTo?: number): ConversationMessage {
    return {
      id: this.getNextMessageId(),
      role,
      content,
      related_to: relatedTo,
      timestamp: new Date().toISOString()
    };
  }
}
```

#### 18.4 File Path Handling (TILDE EXPANSION)
```typescript
function expandTildePath(path: string): string {
  if (path.startsWith("~")) {
    try {
      return path.replace("~", os.homedir());
    } catch (e) {
      return path; // Return original if expansion fails
    }
  }
  return path;
}
```

#### 18.5 JSON Escape Sequence Processing (EXACT ORDER)
```typescript
function unescapeStreamingJson(content: string): string {
  // Apply transformations in EXACT order - critical for streaming
  return content
    .replace(/\\\\\\\\/g, '<<<BS>>>')
    .replace(/\\\\\\n/g, '<<<NL>>>')
    .replace(/\\\\\\t/g, '<<<TAB>>>')
    .replace(/\\\\"/g, '<<<DQ>>>')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/<<<NL>>>/g, '\\n')
    .replace(/<<<TAB>>>/g, '\\t')
    .replace(/<<<DQ>>>/g, '"')
    .replace(/<<<BS>>>/g, '\\');
}
```

#### 18.6 Error Classification (NON-RETRYABLE TYPES)
```typescript
const NON_RETRYABLE_ERROR_TYPES = [
  "SUBSCRIPTION_LIMIT_REACHED",
  "TRIAL_EXPIRED", 
  "PAYMENT_ACTION_REQUIRED",
  "USAGE_BILLING_REQUIRED",
  "USAGE_BILLING_LIMIT_REACHED",
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_PAYMENT_FAILED",
  "OVERAGE_PAYMENT_FAILED",
  "AUTHENTICATION_ERROR"
];

function isRetryableError(error: any): boolean {
  if (error?.error?.error_type) {
    return !NON_RETRYABLE_ERROR_TYPES.includes(error.error.error_type);
  }
  return true; // Default to retryable
}
```

#### 18.7 UI Sequence Management (PREVENTS OUT-OF-ORDER UPDATES)
```typescript
class UISequenceManager {
  private sequenceCounters = new Map<number, number>(); // conversation_id -> sequence
  
  getNextSequence(conversationId: number): number {
    const current = this.sequenceCounters.get(conversationId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(conversationId, next);
    return next;
  }
}
```

#### 18.8 Timing Constants (EXACT VALUES)
```typescript
const TIMING_CONFIG = {
  MAX_POLLING_ATTEMPTS: 3000,
  POLLING_SLEEP_MS: 100,
  ACTIVITY_TIMEOUT_MS: 30000,
  HEALTH_CHECK_TIMEOUTS_MS: [5000, 10000, 15000],
  RETRY_PAUSE_MS: 2000
};
```

#### 18.9 Conversation Log Structure (EXACT JSON FORMAT)
```typescript
interface ConversationEntry {
  id: number;                    // Sequential integer
  role: 'user' | 'assistant';   // Exact strings
  content: string;
  related_to?: number;           // Optional integer ID
  original_query?: boolean;      // Flag for conversation starts
  procedural?: boolean;          // Flag for system messages
  function_call?: FunctionCall;  // Function call data
  timestamp: string;             // ISO timestamp
}
```

#### 18.10 Button State Tracking (PER-MESSAGE)
```typescript
interface ButtonState {
  message_id: number;
  buttons_run: string[];
  next_button: string | null;
  on_deck_button: string | null;
}

class ButtonStateManager {
  private buttonStates = new Map<number, ButtonState>();
  
  markButtonAsRun(messageId: number, buttonType: string): void {
    const state = this.buttonStates.get(messageId) || {
      message_id: messageId,
      buttons_run: [],
      next_button: null,
      on_deck_button: null
    };
    
    if (!state.buttons_run.includes(buttonType)) {
      state.buttons_run.push(buttonType);
    }
    
    this.buttonStates.set(messageId, state);
  }
}
```

### 19. Implementation Order

**PHASE 1: Core Infrastructure (Week 1-2)**
1. **Extension Setup**
   - Create package.json with all dependencies
   - Set up TypeScript configuration
   - Create basic extension.ts entry point
   - Register webview view provider

2. **Backend Client Foundation**
   - Implement `backendClient.ts` with basic HTTP client
   - Add environment detection (local vs production)
   - Implement health check functionality
   - Add basic error handling

3. **Basic Settings Management**
   - Implement `settingsManager.ts` core functionality
   - Add API key storage using VS Code secrets
   - Provider selection and model configuration
   - Create settings persistence layer

**PHASE 2: Conversation System (Week 3-4)**
4. **Conversation Management**
   - Implement `conversationManager.ts`
   - Add conversation creation, loading, switching
   - Implement persistence to disk
   - Add conversation naming functionality

5. **Message Store**
   - Create `messageStore.ts` with message management
   - Implement message ID generation
   - Add message persistence and retrieval
   - Create diff data storage for file changes

6. **Basic Webview**
   - Set up React webview-ui project
   - Create basic conversation display
   - Implement webview ↔ extension messaging
   - Add message input functionality

**PHASE 3: Backend Integration (Week 5-6)**
7. **Streaming Parser**
   - Implement `streamingParser.ts` for SSE parsing
   - Handle partial JSON buffering
   - Add function call extraction
   - Implement error response parsing

8. **Backend Communication**
   - Complete backend query sending
   - Add streaming response handling
   - Implement request cancellation
   - Add attachment upload/deletion

9. **Basic AI Conversation**
   - Connect webview to backend
   - Implement streaming message display
   - Add basic conversation flow
   - Test with simple text queries

**PHASE 4: Document Integration (Week 7-8)**
10. **Document Manager** (CRITICAL - was missing)
    - Implement `documentManager.ts`
    - Add `getAllOpenDocuments()` using VS Code API
    - Implement `matchTextInOpenDocuments()`
    - Add `updateOpenDocumentContent()` functionality
    - Handle unsaved files with synthetic paths

11. **Context Management**
    - Implement `contextManager.ts`
    - Add file/directory context attachment
    - Implement symbol extraction for undefined variables
    - Add documentation context integration

12. **File Operations Integration**
    - Connect document operations to AI context
    - Test document matching functionality
    - Validate content updates work properly

**PHASE 5: Function Call System (Week 9-11)**
13. **Function Call Handler**
    - Implement `functionCallHandler.ts`
    - Register all function handlers
    - Add function call routing and execution
    - Implement result formatting

14. **Core Function Handlers**
    - `EditFileHandler` - file editing operations
    - `SearchHandler` - find_keyword_context
    - `ConsoleHandler` - R/Python console execution
    - `TerminalHandler` - shell command execution
    - `ImageHandler` - image viewing and processing

15. **Advanced Function Handlers**
    - `ReadFileHandler` - file reading with line ranges
    - `SearchForFileHandler` - file search functionality
    - `ListDirectoryHandler` - directory listing
    - `DeleteFileHandler` - file deletion
    - `RunFileHandler` - script execution
    - `GrepSearchHandler` - pattern searching
    - `WebSearchHandler` - web search integration

**PHASE 6: Widget System (Week 12-13)**
16. **Base Widget Infrastructure**
    - Implement `baseWidget.ts` abstract class
    - Create `widgetManager.ts` for lifecycle management
    - Add widget HTML generation
    - Implement widget state persistence

17. **Core Widgets**
    - `EditFileWidget` - file editing with diff display
    - `ConsoleWidget` - console command execution
    - `TerminalWidget` - terminal command execution
    - Test widget actions and state management

**PHASE 7: Automation System (Week 14-15)**
18. **Automation Settings** (CRITICAL - was completely missing)
    - Add complete `AutomationSettings` interface
    - Implement all 14 automation flags (auto_accept_edits, etc.)
    - Add allow/deny list management
    - Create automation settings UI with exact field names matching RAO

19. **Automation Engine**
    - Implement `automationEngine.ts`
    - Add validation logic for allow/deny lists
    - Implement auto-execution methods
    - Add function extraction from commands
    - Handle tilde path expansion

20. **Auto-execution Integration**
    - Connect automation to widget system
    - Implement automatic widget acceptance
    - Add safety validation
    - Test automation workflows

**PHASE 8: Attachment System (Week 16)**
21. **Attachment Management**
    - Implement `attachmentManager.ts`
    - Add file upload functionality
    - Implement provider-specific handling
    - Add CSV-based attachment tracking

22. **Image Processing**
    - Create `imageProcessor.ts`
    - Add image resizing for AI consumption
    - Implement duplicate detection
    - Add image context integration

**PHASE 9: UI Polish & Features (Week 17-18)**
23. **Advanced UI Components**
    - `StreamingDisplay` with real-time updates
    - `MarkdownRenderer` with custom formatting
    - `SyntaxHighlighter` for code blocks
    - `ButtonStateManager` for interactive buttons

24. **Message Management**
    - Implement message limits (50 assistant messages)
    - Add message ID preallocation for parallel calls
    - Create function call message generation
    - Add conversation state tracking

**PHASE 10: Advanced Features (Week 19-20)**
25. **User Rules System**
    - Add user rules file management
    - Implement rules editing interface
    - Connect rules to AI system prompts
    - Add rules persistence

26. **Diff and History**
    - Implement line diff algorithm
    - Add file change history tracking
    - Create revert functionality
    - Add diff visualization

### 19. Complete Architecture Summary

This **UPDATED** implementation plan now provides a complete TypeScript-based solution that:

1. **Interfaces directly with the rao-backend** using the exact same protocol
2. **Implements ALL UI functionality** in TypeScript/React
3. **Maintains complete feature parity** with the original RAO system including:
   - **Complete automation system** with auto-accept settings for edits, console, terminal
   - **Security-focused allow/deny lists** for automation control
   - **Document matching and manipulation** functions that were initially missed
   - **ALL RPC methods** found in SessionAi.cpp
   - **Advanced function call handling** with proper state management
   - **User rules management** and settings persistence
4. **Uses VS Code extension APIs** for deep editor integration
5. **Provides the exact same user experience** with streaming conversations, widgets, and function capabilities
6. **Follows a systematic 22-week implementation plan** ensuring every feature is built in the correct order
7. **Includes all critical low-level implementation details** for exact compatibility

**CRITICAL ADDITIONS in this update:**
- **Automation Engine** with complete settings and validation
- **Document Manager** for open document operations that were missing
- **Advanced Function Handlers** for all the function types discovered in RAO
- **Message State Management** for proper conversation flow
- **Critical Implementation Details** including streaming buffer logic, SSE parsing, escape sequences, timing constants, and exact data structures
- **Systematic Implementation Order** preventing confusion and ensuring completeness

**Why These Details Matter:**
These seemingly small details are what make the difference between a "similar" system and an **exact reproduction**. Missing any of these would cause:
- Broken streaming (buffer logic)
- Protocol incompatibility (SSE format)
- UI state corruption (sequence management)
- File path matching failures (tilde expansion)
- Incorrect retry behavior (error classification)
- Conversation corruption (message structure)
- Widget state bugs (button tracking)