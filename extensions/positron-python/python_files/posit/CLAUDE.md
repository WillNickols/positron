# Bash commands
- nox -s lint: Linting, formatting, and type checking
- nox -s lint_fix: Fix linting and formatting issues
- nox -s test: Run tests
- grep -r -A1 "@pytest.fixture" positron/tests/ | grep "def " | sed 's/.*def //' | sed 's/(.*$//' | sort: List pytest fixture names

# Project structure
## Directory organization
- Main code in: positron/
- Tests located in: positron/tests/
- Nox file: noxfile.py
- Patches for third-party libraries: positron/patch/
- Docstring processing: positron/docstrings/

## Core components
- positron_ipkernel.py: Extended IPython kernel with Positron features
- positron_jedilsp.py: Language Server Protocol implementation using Jedi
- positron_language_server.py: Entry point launching kernel and LSP server
- positron_comm.py: Base communication infrastructure using JSON-RPC

## Service modules (each with corresponding *_comm.py file)
- data_explorer.py: Data frame exploration and visualization
- variables.py: Variable inspection and management
- plots.py: Plot rendering and management
- connections.py: Database and data source connections
- help.py: Help and documentation system
- ui.py: UI-related functionality

## Supporting modules
- utils.py: Common utilities (background jobs, JSON handling)
- access_keys.py: Security and access control
- matplotlib_backend.py: Custom matplotlib backend
- session_mode.py: Session management
- inspectors.py: Code inspection utilities
- jedi.py: Jedi integration helpers
- lsp.py: LSP service implementation

## Development tools
- Uses ruff for linting and formatting
- Uses pyright for type checking

# Workflow
- Suggest a plan before implementing changes
- When possible, start by adding or updating test cases for the task and running the tests to ensure they fail
- Run linting and tests after making changes

## Tests
- Use existing pytest fixtures where possible
