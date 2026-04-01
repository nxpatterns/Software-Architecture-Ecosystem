# Open Interpreter

Downloads models here: `/Users/<user-name>/Library/Application Support/`

```bash
pip3 install open-interpreter
pip install 'open-interpreter[local]'
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
