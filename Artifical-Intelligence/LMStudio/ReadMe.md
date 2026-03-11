# LM Studio

## LM Studio & Open Interpreter

### LM Studio: Install Runtime for GGUF Models

If you get `No LM Runtime found for model format 'gguf'`:

Go to the **Runtime** section in LM Studio's left sidebar and install the **llama.cpp** runtime. Pick the variant matching your hardware:

- Apple Silicon → Metal
- NVIDIA GPU → CUDA
- No GPU → CPU-only

### LM Studio: Start Local Server

In LM Studio, go to **Local Server / Developer**, load your model, and click **Start Server**.

Default address: `http://127.0.0.1:1234`

Verify it's running and check loaded models:

```bash
curl http://127.0.0.1:1234/v1/models
```

The `id` field in the response is the exact model name you need for Open Interpreter.

### Open Interpreter: Connect to LM Studio

```bash
interpreter \
  --api_base http://127.0.0.1:1234/v1 \
  --api_key fake \
  --model openai/<model-id-from-curl> \
  --context_window 32768 \
  --max_tokens 4096 \
  --no-llm_supports_functions
```

**Notes:**

- `--api_key fake` — LM Studio ignores the key, but Open Interpreter requires something
- `openai/` prefix is required so Open Interpreter uses the correct request format
- `--no-llm_supports_functions` prevents Open Interpreter from sending OpenAI-style function call payloads, which local models handle poorly

**Example with Qwen3.5-9B:**

```bash
interpreter \
  --api_base http://127.0.0.1:1234/v1 \
  --api_key fake \
  --model openai/qwen/qwen3.5-9b \
  --context_window 32768 \
  --max_tokens 4096 \
  --no-llm_supports_functions
```

### LM Studio: Save as Profile (optional)

Create `~/Library/Application Support/open-interpreter/profiles/qwen359b.yaml` with content (simplified for clarity):

```yaml
llm:
  api_base: "http://127.0.0.1:1234/v1"
  api_key: "fake"
  model: "openai/qwen/qwen3.5-9b" # The model to use
  temperature: 0
  context_window: 32768  # Match your model's context window (e.g. 32768 for Qwen3.5-9B)
  max_tokens: 4096
  no_llm_supports_functions: true # Prevents Open Interpreter from sending function call payloads that local models can't handle
  multi_line: true # If True, you can input multiple lines starting and ending with ```
  disable_telemetry: true
  execution_instructions: "To execute code on the user's machine, write a markdown code block. Specify the language after the ```. You will receive the output. Use any programming language."

# Computer Settings
computer:
  import_computer_api: false # Only for Local Models set to false
  offline: true # set to true (offline models)


custom_instructions: >
  Always respond in English, regardless of the query language. When you start say "profiles/qwen359.yaml".

# Documentation
# All options: https://docs.openinterpreter.com/settings

version: 2.0.2  # Profile version (do not modify)
```

Then simply run:

```bash
interpreter --profile qwen359b
```

### Suppress pkg_resources Deprecation Warning

Open Interpreter 0.4.x uses a deprecated `pkg_resources` API. It's harmless but noisy. Suppress it by adding this alias to `~/.zshrc`:

```bash
alias interpreter='python -W ignore::UserWarning -m interpreter'
```

### macOS Sequoia: VSCode "App Data" Permission Prompt

After a VSCode update you may see:

> "Visual Studio Code.app" would like to access data from other apps."

This is a **macOS Sequoia (15.x)** feature called App Data Protection, not a VSCode change. It triggers when VSCode accesses files associated with other apps (e.g. files downloaded via Safari).

**Fix:** System Settings → Privacy & Security → **App Data** → Visual Studio Code → Allow

One-time action, won't prompt again.

### Model Note: Qwen3.5-9B

Released March 2, 2026. Despite the 9B parameter count, it outperforms much larger models on several benchmarks (e.g. beats GPT-OSS-120B on GPQA Diamond). Natively multimodal (text, image, video), 262K context window, Apache 2.0 license. A strong choice for local inference on consumer hardware.
