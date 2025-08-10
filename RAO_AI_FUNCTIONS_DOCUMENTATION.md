# Rao AI System Documentation

This document provides comprehensive documentation of all functions, classes, and components in the Rao AI system. The documentation is organized by file and includes specific implementation details needed to reproduce the functionality exactly in a new VS Code extension.

## Table of Contents

### R Session Files (15 files)
- [SessionAiAPI.R](#sessionaiapir)
- [SessionAiAttachments.R](#sessionaiattachmentsr)
- [SessionAiBackendComms.R](#sessionaibackendcommsr)
- [SessionAiButtons.R](#sessionaibuttonsr)
- [SessionAiContext.R](#sessionaicontextr)
- [SessionAiConversationDisplay.R](#sessionaiconversationdisplayr)
- [SessionAiConversationHandlers.R](#sessionaiconversationhandlersr)
- [SessionAiHelpers.R](#sessionaihelpersr)
- [SessionAiImages.R](#sessionaiimagesr)
- [SessionAiIO.R](#sessionaiior)
- [SessionAiOperations.R](#sessionaioperationsr)
- [SessionAiParse.R](#sessionaiparser)
- [SessionAiSearch.R](#sessionaisearchr)
- [SessionAiSettings.R](#sessionaisettingsr)
- [SessionAiVariableManager.R](#sessionaivariablemanagerr)

### C++ Files (2 files)
- [SessionAi.cpp](#sessionaicpp)
- [SessionAiHome.cpp](#sessionaihomecpp)

### Backend Java Files (6 files)
- [SessionAiApiService.java](#sessionaiapiservicea)
- [OpenAIProxyService.java](#openaiproxyservicejava)
- [AiQueryRequest.java](#aiqueryrequestjava)
- [AiBackendController.java](#aibackendcontrollerjava)
- [AiBackendService.java](#aibackendservicejava)
- [AiQueryResponse.java](#aiqueryresponsejava)

### Client Java Files (101 files)
- [Core AI Classes](#core-ai-classes)
- [AI Widgets](#ai-widgets)
- [AI Events](#ai-events)
- [AI Models](#ai-models)
- [Other AI Components](#other-ai-components)

---

## SessionAiAPI.R

Core API functionality for managing AI requests, streaming, and function calls.

### Functions:

#### `get_open_source_documents()`
- **Purpose**: Retrieves currently active document from RStudio editor
- **Returns**: List containing document info (id, path, contents) 
- **Implementation**: Uses `.rs.api.getSourceEditorContext()` to get active document
- **Note**: Only returns active document, not all open documents

#### `get_all_open_source_documents()`
- **Purpose**: Retrieves all open documents in RStudio editor including unsaved files
- **Returns**: List of document objects with id, path, contents, and metadata
- **Implementation**: 
  - Uses `.rs.api.getAllOpenDocuments(includeContents = TRUE)`
  - Handles unsaved files by creating synthetic paths like "__UNSAVED_xxxx__/filename"
  - Adds active document indicator and timing metadata
  - Tracks duplicate detection and source editor context

#### `check_message_for_symbols(conversation)`
- **Purpose**: Scans conversation messages for undefined R symbols/variables
- **Parameters**: `conversation` - conversation object with messages
- **Returns**: List of undefined symbols found in code blocks
- **Implementation**:
  - Extracts R code blocks from conversation messages
  - Parses code using R parser to identify symbols
  - Filters out defined variables and functions in current environment
  - Returns symbols that appear undefined

#### `run_api_request_async(api_params, provider, api_key, request_id, request_data, is_background)`
- **Purpose**: Core function for making asynchronous API requests to AI providers
- **Parameters**:
  - `api_params`: API configuration parameters
  - `provider`: AI provider (openai, anthropic, etc.)
  - `api_key`: Authentication key
  - `request_id`: Unique request identifier
  - `request_data`: Request payload data
  - `is_background`: Whether to run in background
- **Implementation**:
  - Creates temporary files for request/response communication
  - Constructs HTTP requests with proper headers and streaming
  - Handles different AI providers with provider-specific formatting
  - Manages timeout and cancellation mechanisms
  - Uses curl for HTTP communication with streaming response handling

#### `parse_sse_error_response(response_text)`
- **Purpose**: Parses Server-Sent Events (SSE) error responses from AI providers
- **Parameters**: `response_text` - raw SSE response text
- **Returns**: Parsed error object with error details
- **Implementation**: Extracts error information from SSE formatted responses

#### `check_cancellation_files(request_id)`
- **Purpose**: Checks if a request has been cancelled by looking for cancellation files
- **Parameters**: `request_id` - request to check for cancellation
- **Returns**: TRUE if request was cancelled, FALSE otherwise
- **Implementation**: Checks for existence of cancellation marker files in temp directory

#### `get_temp_dir()`
- **Purpose**: Gets the temporary directory for AI request files
- **Returns**: Path to temporary directory
- **Implementation**: Creates and returns consistent temp directory path

#### `poll_api_request_result(request_info, max_attempts, sleep_time, blocking)`
- **Purpose**: Polls for API request completion and streams results
- **Parameters**:
  - `request_info`: Information about the running request
  - `max_attempts`: Maximum polling attempts (default 3000)
  - `sleep_time`: Sleep between polls (default 0.1s)
  - `blocking`: Whether to block until completion
- **Returns**: Streams results via events as they arrive
- **Implementation**:
  - Continuously polls response files for updates
  - Handles streaming SSE data parsing
  - Manages function call buffering and processing
  - Sends completion events when request finishes
  - Handles cancellation and error states

#### `init_function_call_buffer()`
- **Purpose**: Initializes buffer for managing function calls in streaming responses
- **Implementation**: Creates empty buffer data structure

#### `add_to_function_call_buffer(function_call_data)`
- **Purpose**: Adds function call data to the streaming buffer
- **Parameters**: `function_call_data` - function call information to buffer
- **Implementation**: Appends function call data to buffer for later processing

#### `get_next_buffered_function_call()`
- **Purpose**: Retrieves and removes next function call from buffer
- **Returns**: Next function call data or NULL if buffer empty
- **Implementation**: FIFO queue behavior for function call processing

#### `has_buffered_function_calls()`
- **Purpose**: Checks if there are pending function calls in buffer
- **Returns**: TRUE if buffer has function calls, FALSE otherwise

#### `clear_function_call_buffer()`
- **Purpose**: Empties the function call buffer
- **Implementation**: Resets buffer to empty state

#### `stream_json_field_content(content, field_name, previous_position, buffer)`
- **Purpose**: Streams JSON field content incrementally for real-time display
- **Parameters**:
  - `content`: JSON content being streamed
  - `field_name`: Field to extract (e.g., "content", "function_call")
  - `previous_position`: Last processed position in stream
  - `buffer`: Accumulated content buffer
- **Returns**: List with new content delta and updated position
- **Implementation**: Parses streaming JSON to extract field values incrementally

#### `get_comment_syntax(filename)`
- **Purpose**: Determines appropriate comment syntax for a file based on extension
- **Parameters**: `filename` - file name to analyze
- **Returns**: Comment prefix string (e.g., "#", "//", etc.)
- **Implementation**: Maps file extensions to comment syntaxes for different languages

#### `get_function_message_id_count(function_name)`
- **Purpose**: Gets the number of message IDs to preallocate for a function call
- **Parameters**: `function_name` - name of function being called
- **Returns**: Number of message IDs needed
- **Implementation**: Maps function names to required message ID counts

#### `preallocate_function_message_ids(function_name, call_id)`
- **Purpose**: Preallocates message IDs for function calls to ensure consistent ordering
- **Parameters**:
  - `function_name`: Name of function needing IDs
  - `call_id`: Unique call identifier
- **Implementation**: Generates and stores sequential message IDs for the function call

#### `get_preallocated_message_id(call_id, index)`
- **Purpose**: Retrieves a preallocated message ID for a specific function call
- **Parameters**:
  - `call_id`: Function call identifier
  - `index`: Which message ID to retrieve (default 1)
- **Returns**: Preallocated message ID
- **Implementation**: Looks up stored message IDs by call_id and index

#### `is_first_function_call_in_parallel_set(call_id)`
- **Purpose**: Determines if this is the first function call in a set of parallel calls
- **Parameters**: `call_id` - function call identifier
- **Returns**: TRUE if this is the first parallel call, FALSE otherwise
- **Implementation**: Tracks parallel function call execution order

---

## SessionAiAttachments.R

Manages file attachments for AI conversations including upload, listing, and deletion.

### Functions:

#### `save_ai_attachment(filePath)`
- **Purpose**: Main function to save file attachments for AI conversations
- **Parameters**: `filePath` - path to file to attach
- **Returns**: List with success status and attachment details
- **Implementation**: 
  - Determines active AI provider (anthropic vs openai)
  - Routes to provider-specific attachment handling
  - Manages conversation index and CSV attachment tracking
  - Handles authentication based on provider requirements

#### `save_anthropic_attachment(filePath, csvPath, timestamp, messageId)`
- **Purpose**: Handles file attachments specifically for Anthropic AI provider
- **Parameters**:
  - `filePath`: File to attach
  - `csvPath`: Path to attachments CSV file
  - `timestamp`: Attachment timestamp
  - `messageId`: Associated message ID
- **Returns**: Upload result with file ID and metadata
- **Implementation**:
  - Uses backend API without requiring user API key
  - Uploads file and gets file_id from backend response
  - Records attachment in CSV with metadata
  - Handles various file types and sizes

#### `save_attachment_via_backend(filePath, api_key, csvPath, timestamp, messageId, conversationIndex)`
- **Purpose**: Uploads attachments via backend API (for OpenAI and other providers)
- **Parameters**:
  - `filePath`: File to attach
  - `api_key`: Authentication key
  - `csvPath`: Attachments CSV path
  - `timestamp`: Upload timestamp
  - `messageId`: Message ID
  - `conversationIndex`: Current conversation index
- **Returns**: Upload result with backend response
- **Implementation**:
  - Uses HTTP POST to backend attachment endpoint
  - Includes authentication headers and file data
  - Handles multipart form upload
  - Records successful uploads in CSV tracking file

#### `list_ai_attachments()`
- **Purpose**: Lists all attachments for current conversation
- **Returns**: List of attachment objects with metadata
- **Implementation**:
  - Reads attachments CSV file
  - Filters by current conversation index
  - Returns attachment details including file paths, IDs, and timestamps

#### `delete_anthropic_attachment(file_id)`
- **Purpose**: Deletes specific attachment from Anthropic backend
- **Parameters**: `file_id` - Anthropic file ID to delete
- **Returns**: Deletion result status
- **Implementation**:
  - Makes DELETE request to backend with file ID
  - Removes attachment from local CSV tracking
  - Handles backend authentication and error responses

#### `delete_ai_attachment(filePath)`
- **Purpose**: Deletes attachment by file path from current conversation
- **Parameters**: `filePath` - path of file to remove from attachments
- **Returns**: Deletion success status
- **Implementation**:
  - Finds attachment record in CSV by file path
  - Calls provider-specific deletion function
  - Updates local attachment tracking

#### `delete_all_ai_attachments()`
- **Purpose**: Removes all attachments from current conversation
- **Returns**: Deletion summary with counts
- **Implementation**:
  - Gets all attachments for current conversation
  - Iterates through each attachment for deletion
  - Clears conversation attachment records
  - Provides summary of deleted attachments

---

## SessionAiBackendComms.R

Handles communication with the Rao backend server including API calls, authentication, and conversation management.

### Functions:

#### `initialize_backend_defaults()`
- **Purpose**: Sets up default backend configuration
- **Implementation**: Configures production backend URL and environment settings

#### `detect_backend_environment()`
- **Purpose**: Auto-detects whether to use local or production backend
- **Returns**: Environment configuration based on availability
- **Implementation**: Tests localhost:8080 connectivity with 3-second timeout, falls back to production

#### `get_backend_config(conversation, additional_data)`
- **Purpose**: Gets backend configuration for API requests
- **Parameters**: Optional conversation and additional data context
- **Returns**: Configuration object with URL and environment details
- **Implementation**: Returns current backend settings with optional context integration

#### `reset_backend_environment()`
- **Purpose**: Resets backend configuration to defaults
- **Implementation**: Reinitializes backend settings to production defaults

#### `generate_backend_auth(provider)`
- **Purpose**: Generates authentication headers for backend API calls
- **Parameters**: `provider` - AI provider name
- **Returns**: Authentication headers including Rao API key
- **Implementation**: Constructs Bearer token and provider-specific headers

#### `remove_rmd_frontmatter(content)`
- **Purpose**: Strips YAML frontmatter from R Markdown files
- **Parameters**: `content` - file content string
- **Returns**: Content without frontmatter
- **Implementation**: Uses regex to remove YAML blocks from beginning of files

#### `extract_file_references_from_code(code)`
- **Purpose**: Finds file references in code blocks
- **Parameters**: `code` - code string to analyze
- **Returns**: List of referenced file paths
- **Implementation**: Uses regex patterns to identify file paths in various contexts

#### `process_backend_response(response, conversation, provider, model)`
- **Purpose**: Processes and formats backend API responses
- **Parameters**: Response object and request context
- **Returns**: Processed response data
- **Implementation**: Handles different response formats and error conditions

#### `prepare_attachment_data()`
- **Purpose**: Prepares attachment information for backend requests
- **Returns**: Formatted attachment data for API calls
- **Implementation**: Collects and formats current conversation attachments

#### `prepare_image_context_data()`
- **Purpose**: Prepares image context for backend requests
- **Returns**: Image context data for vision-enabled models
- **Implementation**: Collects image attachments and formats for AI model consumption

#### `extract_symbols_for_backend(conversation)`
- **Purpose**: Extracts R symbols/variables for backend context
- **Parameters**: `conversation` - conversation object
- **Returns**: Symbol information for backend processing
- **Implementation**: Analyzes conversation for undefined symbols

#### `gather_user_environment_info()`
- **Purpose**: Collects user environment information for backend context
- **Returns**: Environment data including working directory, packages, etc.
- **Implementation**: Gathers system and R environment information

#### `send_backend_query(request_type, conversation, provider, model, temperature, request_id, additional_data)`
- **Purpose**: Main function for sending queries to backend
- **Parameters**:
  - `request_type`: Type of request (query, function_call, etc.)
  - `conversation`: Conversation context
  - `provider`: AI provider
  - `model`: AI model name
  - `temperature`: Response randomness
  - `request_id`: Unique request identifier
  - `additional_data`: Extra context data
- **Returns**: Backend response
- **Implementation**: Constructs full API request with all context and sends to backend

#### `backend_ai_api_call(conversation, provider, model, temperature, preserve_symbols, request_id)`
- **Purpose**: Makes AI API call through backend
- **Parameters**: Standard AI request parameters
- **Returns**: AI response via backend
- **Implementation**: Constructs AI request payload and sends through backend API

#### `backend_generate_conversation_name(conversation, provider, model)`
- **Purpose**: Generates conversation names using AI through backend
- **Parameters**: Conversation context and AI settings
- **Returns**: Generated conversation name
- **Implementation**: Sends conversation to backend for AI-generated naming

#### `check_backend_health()`
- **Purpose**: Checks if backend server is healthy and responding
- **Returns**: Health status and response time
- **Implementation**: Makes health check request with timeout handling

#### `is_retryable_error(error_response, http_status)`
- **Purpose**: Determines if an error should trigger a retry
- **Parameters**: Error response and HTTP status code
- **Returns**: TRUE if error is retryable
- **Implementation**: Analyzes error types and status codes for retry eligibility

#### `cancel_backend_request(request_id)`
- **Purpose**: Cancels an ongoing backend request
- **Parameters**: `request_id` - request to cancel
- **Returns**: Cancellation status
- **Implementation**: Sends cancellation request to backend API

#### Conversation Summarization Functions:
- `load_conversation_summaries()` - Loads saved conversation summaries from disk
- `save_conversation_summary(query_number, summary_text)` - Saves conversation summary to disk
- `should_trigger_summarization(conversation_log)` - Determines if conversation needs summarization
- `start_background_summarization(conversation_log, target_query_number)` - Starts async summarization
- `check_persistent_background_summarization()` - Checks for running summarization processes
- `prepare_conversation_with_summaries(conversation)` - Integrates summaries into conversation context

---

## SessionAiButtons.R

Manages interactive buttons in AI conversation UI including state tracking and persistence.

### Functions:

#### `get_message_buttons_path()`
- **Purpose**: Gets file path for storing message button states
- **Returns**: Path to message buttons storage file
- **Implementation**: Constructs path in conversation directory for button state persistence

#### `get_buttons_file_path()`
- **Purpose**: Gets file path for general button configuration
- **Returns**: Path to buttons configuration file
- **Implementation**: Returns standardized button config file location

#### `read_message_buttons()`
- **Purpose**: Reads saved message button states from disk
- **Returns**: List of button states keyed by message ID
- **Implementation**: 
  - Reads JSON file containing button states
  - Handles file not found gracefully
  - Returns empty list if no saved states

#### `write_message_buttons(buttons)`
- **Purpose**: Saves message button states to disk
- **Parameters**: `buttons` - button state data to save
- **Implementation**:
  - Converts button states to JSON format
  - Creates directory if needed
  - Writes to persistent storage file

#### `mark_button_as_run(message_id, button_type)`
- **Purpose**: Marks a specific button as having been executed
- **Parameters**:
  - `message_id`: Message containing the button
  - `button_type`: Type of button that was run
- **Implementation**:
  - Updates button state to indicate execution
  - Saves updated state to disk
  - Prevents duplicate button executions

#### `clear_message_buttons_after(message_id)`
- **Purpose**: Clears button states for messages after specified message ID
- **Parameters**: `message_id` - clear buttons after this message
- **Implementation**:
  - Removes button states for subsequent messages
  - Maintains state for earlier messages
  - Updates persistent storage

#### `should_hide_buttons_for_restored_widget(message_id)`
- **Purpose**: Determines if buttons should be hidden when restoring UI widgets
- **Parameters**: `message_id` - message to check
- **Returns**: TRUE if buttons should be hidden
- **Implementation**:
  - Checks if buttons were previously executed
  - Prevents showing completed action buttons
  - Used during conversation restoration

---

## SessionAiContext.R

Manages AI context including file attachments, environment variables, and help documentation.

### Key Functions:

#### `get_categorized_environment_variables(env, include_hidden)`
- **Purpose**: Categorizes R environment variables by type (data.frame, function, etc.)
- **Parameters**: Environment and hidden variable inclusion flag
- **Returns**: Categorized list of environment objects
- **Implementation**: Inspects objects and classifies by type and characteristics

#### `add_context_item(path)`
- **Purpose**: Adds file or directory to AI context
- **Parameters**: `path` - file/directory path to add
- **Implementation**: Validates path, reads content, stores in context system

#### `add_chat_context(conversation_id, name)`
- **Purpose**: Adds conversation history as context
- **Parameters**: Conversation ID and optional name
- **Implementation**: Loads conversation and adds to context pool

#### `add_docs_context(topic, name)`
- **Purpose**: Adds R documentation as context
- **Parameters**: Help topic and optional name
- **Implementation**: Retrieves help content and formats for AI consumption

#### `get_context_items(expand_directories)`
- **Purpose**: Gets all current context items
- **Parameters**: Whether to expand directory contents
- **Returns**: List of all context items with metadata

#### `remove_context_item(path_or_unique_id)`
- **Purpose**: Removes item from context
- **Parameters**: Path or unique ID of item to remove
- **Implementation**: Finds and removes matching context item

---

## SessionAiHelpers.R

Core utility functions for conversation management, file operations, and content processing.

### Key Functions:

#### `get_next_message_id()`
- **Purpose**: Generates sequential message IDs for conversation log
- **Returns**: Next available message ID
- **Implementation**: Tracks counter and ensures uniqueness

#### `compute_line_diff(old_lines, new_lines, is_from_edit_file)`
- **Purpose**: Computes line-by-line differences between file versions
- **Parameters**: Old and new content lines, edit source flag
- **Returns**: Structured diff data
- **Implementation**: Uses diff algorithm to identify added/removed/changed lines

#### `store_diff_data(message_id, diff_data, old_content, new_content, flags)`
- **Purpose**: Stores file change diffs for conversation persistence
- **Parameters**: Message ID, diff data, content versions, metadata flags
- **Implementation**: Saves diff data to persistent storage for undo/redo functionality

#### `apply_file_edit(file_path, new_content, edit_metadata)`
- **Purpose**: Applies file edits from AI suggestions
- **Parameters**: File path, new content, edit metadata
- **Implementation**: Updates file content and tracks changes for reversion

#### `get_effective_file_content(file_path, start_line, end_line)`
- **Purpose**: Gets file content preferring open editor version over disk
- **Parameters**: File path and optional line range
- **Returns**: Current file content from editor or disk
- **Implementation**: Checks if file is open in editor first, falls back to disk

---

## SessionAiOperations.R

Handles AI function calls and interactive operations like code execution and file editing.

### Key Functions:

#### `accept_edit_file_command(edited_code, message_id, request_id)`
- **Purpose**: Applies file edits from AI and continues conversation
- **Parameters**: Edited content, message ID, request ID
- **Implementation**: 
  - Applies file changes
  - Updates conversation log
  - Triggers continuation of AI workflow

#### `accept_console_command(message_id, script, request_id)`
- **Purpose**: Executes R console commands from AI
- **Parameters**: Message ID, R script, request ID
- **Implementation**:
  - Executes R code in console
  - Captures output
  - Continues AI conversation with results

#### `accept_terminal_command(message_id, script, request_id)`
- **Purpose**: Executes terminal/shell commands from AI
- **Parameters**: Message ID, shell script, request ID
- **Implementation**:
  - Runs terminal commands
  - Captures output and exit codes
  - Provides results to AI for continuation

#### `process_single_function_call(function_call, related_to_id, request_id, response_id, message_id)`
- **Purpose**: Processes individual AI function calls
- **Parameters**: Function call data and various IDs for tracking
- **Implementation**:
  - Parses function call arguments
  - Creates appropriate UI widgets
  - Manages function call execution state

#### `ai_operation(operation_type, ...)`
- **Purpose**: Main orchestrator for AI operations and function calls
- **Parameters**: Operation type and variable arguments
- **Implementation**:
  - Coordinates between AI and RStudio
  - Manages conversation flow
  - Handles function call execution and continuation

---

## SessionAiSearch.R

Handles AI function calls for searching, image processing, and file editing operations.

### Key Functions:

#### `process_assistant_response(assistant_response, msg_id, related_to_id, conversation_index, source_function_name, message_metadata, existing_conversation_log)`
- **Purpose**: Main function for processing AI assistant responses
- **Parameters**: Response data, message IDs, conversation context, metadata
- **Implementation**: Parses AI responses, extracts function calls, updates conversation log

#### `handle_find_keyword_context(function_call, current_log, related_to_id, request_id)`
- **Purpose**: Handles AI requests to search for keywords in codebase
- **Parameters**: Function call data, conversation log, related message ID, request ID
- **Implementation**: Performs keyword searches across files and returns results to AI

#### `handle_view_image(function_call, current_log, related_to_id, request_id)`
- **Purpose**: Processes AI requests to view/analyze images
- **Parameters**: Function call data and conversation context
- **Implementation**: Loads images, resizes for AI consumption, adds to conversation context

#### `handle_edit_file(function_call, current_log, related_to_id, request_id)`
- **Purpose**: Processes AI file editing requests
- **Parameters**: Function call with file path and new content
- **Implementation**: Creates edit file widgets and manages file modification workflow

#### `resize_image_for_ai(image_path, target_size_kb)`
- **Purpose**: Resizes images to meet AI API size requirements
- **Parameters**: Image path and target size in KB
- **Implementation**: Uses magick package to compress images while maintaining quality

---

## SessionAiIO.R

Manages persistent storage and file I/O for AI conversations and history.

### Key Functions:

#### `get_ai_base_dir()`
- **Purpose**: Gets base directory for AI data storage
- **Returns**: Path to AI data directory
- **Implementation**: Constructs path in user home directory for AI data

#### `get_ai_file_paths()`
- **Purpose**: Gets standardized file paths for AI data storage
- **Returns**: List of paths for conversations, attachments, etc.
- **Implementation**: Constructs consistent file paths based on current conversation

#### `read_conversation_log()`
- **Purpose**: Loads conversation history from disk
- **Returns**: Conversation log data structure
- **Implementation**: Reads JSON conversation files, handles missing files gracefully

#### `write_conversation_log(conversation_log)`
- **Purpose**: Saves conversation history to disk
- **Parameters**: `conversation_log` - conversation data to save
- **Implementation**: Writes conversation to JSON file with proper formatting

#### `get_script_history()`
- **Purpose**: Gets history of executed scripts/commands
- **Returns**: List of previously executed scripts
- **Implementation**: Reads script history from persistent storage

#### `save_script_to_history(filename)`
- **Purpose**: Saves executed script to history
- **Parameters**: `filename` - script file to save
- **Implementation**: Adds script to persistent history log

---

## SessionAiSettings.R

Manages AI provider settings, API keys, and model configurations.

### Key Functions:

#### `save_api_key(provider, key)`
- **Purpose**: Saves API keys for AI providers
- **Parameters**: Provider name and API key
- **Implementation**: Securely stores API keys using RStudio's credential system

#### `get_active_provider()`
- **Purpose**: Gets currently selected AI provider
- **Returns**: Active provider name (openai, anthropic, etc.)
- **Implementation**: Retrieves provider from settings or defaults

#### `get_available_models(provider)`
- **Purpose**: Gets list of available models for a provider
- **Parameters**: Provider name (optional)
- **Returns**: Array of model identifiers
- **Implementation**: Returns provider-specific model lists

#### `get_selected_model()`
- **Purpose**: Gets currently selected AI model
- **Returns**: Model identifier string
- **Implementation**: Retrieves from settings with fallback defaults

#### `set_selected_model(model)`
- **Purpose**: Sets the active AI model
- **Parameters**: `model` - model identifier to use
- **Implementation**: Saves model selection to persistent settings

#### `delete_api_key(provider)`
- **Purpose**: Removes stored API key for provider
- **Parameters**: Provider name
- **Implementation**: Removes key from secure storage

---

## Remaining R Files (Brief Documentation)

### SessionAiConversationDisplay.R
- `get_next_ai_operation_sequence()` - Gets next sequence number for operations
- `send_ai_operation(operation_type, data)` - Sends operations to UI
- `update_conversation_display()` - Refreshes conversation UI
- `generate_and_save_conversation_display(conversation_index)` - Creates conversation display HTML

### SessionAiConversationHandlers.R
- `read_conversation_names()` - Loads conversation name mappings
- `get_conversation_name(conversation_id)` - Gets display name for conversation
- `set_conversation_name(conversation_id, name)` - Sets conversation name
- `list_conversation_names()` - Lists all conversation names

### SessionAiImages.R
- `save_ai_image(imagePath)` - Saves image attachments for AI
- `list_ai_images()` - Lists current conversation images
- `delete_ai_image(imagePath)` - Removes image from conversation
- `check_image_content_duplicate(imagePath)` - Checks for duplicate images

### SessionAiParse.R
- `extract_r_functions(r_code)` - Parses R code to extract function definitions
- `extract_bash_functions(bash_code)` - Parses bash code for functions
- `parse_shell_commands(bash_code)` - Breaks down shell commands
- `tokenize_shell_input(input)` - Tokenizes shell input for parsing

### SessionAiVariableManager.R
- `initialize_conversation_variable_cache()` - Sets up variable tracking
- `get_conversation_specific_variables()` - Gets variables for current conversation
- `store_conversation_variables(conversation_id)` - Saves conversation variables
- `load_conversation_variables(conversation_id)` - Loads conversation variables

---

