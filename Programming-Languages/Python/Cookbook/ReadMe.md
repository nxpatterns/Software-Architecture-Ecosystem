# Python Cookbook

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Conda](#conda)
  - [Setup Conda (Anaconda)](#setup-conda-anaconda)
    - [Delete Existing Anaconda Installation (if applicable)](#delete-existing-anaconda-installation-if-applicable)
    - [Install Anaconda](#install-anaconda)
  - [Conda Cheatsheet](#conda-cheatsheet)
    - [Pip installs globally instead of in the current environment](#pip-installs-globally-instead-of-in-the-current-environment)
    - [Repair Base Environment](#repair-base-environment)

<!-- /code_chunk_output -->

## Conda

### Setup Conda (Anaconda)

#### Delete Existing Anaconda Installation (if applicable)

```shell
brew uninstall --cask anaconda
brew cleanup
rm -rf ~/opt/anaconda3
rm -rf ~/anaconda3
rm -rf ~/.anaconda_backup
rm -rf ~/.condarc ~/.conda ~/.continuum
rm -rf ~/Library/Caches/pip
rm -rf ~/Library/Application\ Support/pip
```

#### Install Anaconda

```shell
brew install --cask anaconda
source /opt/homebrew/anaconda3/bin/activate
conda init
```

### Conda Cheatsheet

Starting with conda 25.3, the implicit addition of 'defaults' channel will be removed.To resolve this:

```shell
conda config --add channels defaults
# to verify
conda config --show channels
```

#### Pip installs globally instead of in the current environment

```shell
conda config --set pip_interop_enabled True
conda config --append channels pip
conda config --show channels
conda install <package>

```

#### Repair Base Environment

```shell
conda update -n base conda
# If that fails, reset base to default:
conda install --rev 0
# If you need a complete reset:
conda remove --name base --all
conda create --name base python=3.12
# Verify environment health:
conda list
conda info
````

#### Change Conda Prompt Format

```shell
conda config --set env_prompt '{name} '
```

#### List Environments

```shell
conda env list
```

#### Create Conda Environment

```shell
conda create --name <env_name> python=<version>
```

#### Activate Conda Environment

```shell
conda activate <env_name>
```

#### Deactivate Conda Environment

```shell

conda deactivate
```

#### Remove Conda Environment

```shell
conda env remove --name <env_name>
```

#### Rename Conda Environment

```shell
conda create --name new_name --clone old_name
conda remove --name old_name --all
```

#### Clone/Duplicate Conda Environment

```shell
conda create --name new_name --clone old_name
```

#### Disable Automatic Activation of `base`ENV

```shell
conda config --set auto_activate_base false
```

### Update Base Environment

```shell
conda install python=3.11 # e.g. update to 3.11
conda update --all
python --version # Re-check version
```

## Code Examples

### Create QR Code

```python
import qrcode

# Create qr code instance
qr = qrcode.QRCode(
    version = 1,
    error_correction = qrcode.constants.ERROR_CORRECT_H,
    box_size = 10,
    border = 4,
)

# The data that you want to store
data = 'https://tosomewhere'

# Add data
qr.add_data(data)
qr.make(fit=True)

# Create an image from the QR Code instance
img = qr.make_image()

# Save it somewhere, change the extension as needed:
# img.save("image.png")
# img.save("image.bmp")
# img.save("image.jpeg")
img.save("qr_code.png")
```

## Find Installation Path of a Certain Package

```python
# e.g. for open-interpreter
python -c "import interpreter; print(interpreter.__file__)"
python -c "import interpreter, os; print(os.path.dirname(interpreter.__file__))"
pip show open-interpreter
```
