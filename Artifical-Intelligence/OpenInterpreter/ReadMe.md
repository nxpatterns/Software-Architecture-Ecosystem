# Open Interpreter

Full Documentation: <https://docs.openinterpreter.com/getting-started/introduction>
Downloads models here: `/Users/<user-name>/Library/Application Support/`

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=4 orderedList=false} -->

<!-- code_chunk_output -->

- [Installation & Usage Examples](#installation--usage-examples)
- [Magic Commands](#magic-commands)
- [LLama.ccp](#llamaccp)
  - [Download Miniforge for M1/M2:](#download-miniforge-for-m1m2)
  - [Install it:](#install-it)

<!-- /code_chunk_output -->

## Installation & Usage Examples

```bash
conda create --name interpreter python=3.12
conda activate interpreter
pip install open-interpreter
pip install 'open-interpreter[local]' # for local models support
pip install --ugrade open-interpreter
pip install -U open-interpreter
interpreter --version
interpreter --help

# Alias to open the open-interpreter config folder
open-interpreter-config

# Local Models
interpreter --local_models # searches in ~/Library/Application Support/open-interpreter/models

# Show Local Profiles
interpreter --profiles

# Via Model Name
interpreter --model "claude-3-5-sonnet-20240620"

# Via Profile
interpreter --profile sonnet37.yaml
interpreter --profile sonnet37.yaml --debug
interpreter --profile qwen25-coder-14b.yaml -y

# Local Models

## LMStudio
interpreter --api_base http://127.0.0.1:1234/v1 --api_key lmstudio --model openai/qwen/qwen3.5-9b --context_window 32768 --no-llm_supports_functions
interpreter --api_base http://127.0.0.1:1234/v1 --api_key lmstudio --model ollama/qwen2.5-coder:14b --no-llm_supports_functions -y

## Ollama
interpreter --api_base http://localhost:11434 --api_key ollama --model ollama/qwen2.5-coder:14b -no-llm_supports_functions -y
```

## Magic Commands

```bash
Magic commands can be used to control the interpreter’s behavior in interactive mode:
%% [shell commands, like ls or cd]: Run commands in Open Interpreter’s shell instance
%verbose [true/false]: Toggle verbose mode. Without arguments or with ‘true’, it enters verbose mode. With ‘false’, it exits verbose mode.
%reset: Reset the current session.
%undo: Remove previous messages and its response from the message history.
%save_message [path]: Saves messages to a specified JSON path. If no path is provided, it defaults to ‘messages.json’.
%load_message [path]: Loads messages from a specified JSON path. If no path is provided, it defaults to ‘messages.json’.
%tokens [prompt]: EXPERIMENTAL: Calculate the tokens used by the next request based on the current conversation’s messages and estimate the cost of that request; optionally provide a prompt to also calculate the tokens used by that prompt and the total amount of tokens that will be sent with the next request.
%info: Show system and interpreter information.
%help: Show this help message.
%jupyter: Export the current session to a Jupyter notebook file (.ipynb) to the Downloads folder.
%markdown [path]: Export the conversation to a specified Markdown path. If no path is provided, it will be saved to the Downloads folder with a generated conversation name.
```

## LLama.ccp

If you are using Apple Silicon (M1) Mac but your Python is not of 'arm64' architecture, then the llama.ccp x86 version will be 10x slower on Apple Silicon (M1/M2) Mac.

To install the correct version of Python that supports 'arm64' architecture:

### Download Miniforge for M1/M2:

```shell
wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-MacOSX-arm64.sh

```

### Install it:

```bash
bash Miniforge3-MacOSX-arm64.sh
```
