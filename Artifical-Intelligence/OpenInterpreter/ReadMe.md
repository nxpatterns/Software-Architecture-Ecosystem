# Open Interpreter

Downloads models here: `/Users/<user-name>/Library/Application Support/`

```shell
# Install Python
brew install python

# Install Interpreter
pip3 install open-interpreter
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
