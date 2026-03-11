# Homebrew Cookbook

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Regular Maintenance](#regular-maintenance)
  - [Update and Upgrade](#update-and-upgrade)
  - [Cleanup](#cleanup)
- [Identifying What You Have](#identifying-what-you-have)
  - [Core Commands](#core-commands)
  - [Dependency Analysis](#dependency-analysis)
- [Handling Deprecated Packages](#handling-deprecated-packages)
  - [Remove Deprecated Taps](#remove-deprecated-taps)
  - [Replace Deprecated Formulae](#replace-deprecated-formulae)
- [Managing Multiple Versions](#managing-multiple-versions)
  - [ICU4C (Unicode library)](#icu4c-unicode-library)
  - [PostgreSQL](#postgresql)
  - [General Pattern](#general-pattern)
- [Fixing Common Issues](#fixing-common-issues)
  - [Unlinked Kegs](#unlinked-kegs)
  - [Manual Installation Conflicts](#manual-installation-conflicts)
  - [Broken Casks](#broken-casks)
- [Key Concepts](#key-concepts)
  - [Formulae vs Casks](#formulae-vs-casks)
  - [Leaves vs Dependencies](#leaves-vs-dependencies)
  - [Version Pinning](#version-pinning)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
  - [After Cleanup Issues](#after-cleanup-issues)
  - [Cache Location](#cache-location)
- [Regular Maintenance Schedule](#regular-maintenance-schedule)

<!-- /code_chunk_output -->

## Regular Maintenance

### Update and Upgrade

```bash
# Update Homebrew itself
brew update

# Upgrade all outdated packages
brew upgrade

# Upgrade casks (including auto-update apps with --greedy)
brew upgrade --cask --greedy
```

### Cleanup

```bash
# Remove old versions and cached downloads
brew cleanup -s

# Remove orphaned dependencies
brew autoremove

# Preview what will be removed (dry run)
brew cleanup -s --dry-run
brew autoremove --dry-run
```

## Identifying What You Have

### Core Commands

```bash
# Show explicitly installed packages (your "root" packages)
brew leaves

# Show all installed formulae
brew list --formula

# Show all installed casks
brew list --cask

# Check package sizes
brew list --formula -1 | xargs -n1 -I{} sh -c 'echo $(brew info {} | grep "^/opt" | xargs du -sh 2>/dev/null | cut -f1) {}'
```

### Dependency Analysis

```bash
# See what depends on a package
brew uses --installed PACKAGE_NAME

# See missing dependencies
brew missing

# Full system check
brew doctor
```

## Handling Deprecated Packages

### Remove Deprecated Taps

```bash
# List all taps
brew tap

# Remove specific tap
brew untap TAP_NAME
```

### Replace Deprecated Formulae

```bash
# Terraform → use version manager or OpenTofu
brew uninstall terraform
brew install tfenv  # or opentofu

# Gradle versioned → current Gradle
brew uninstall gradle@7
brew install gradle
```

## Managing Multiple Versions

### ICU4C (Unicode library)

```bash
# Remove old versions, keep latest
brew uninstall --ignore-dependencies icu4c@76 icu4c@77
# System will keep icu4c@78 or whatever is current
```

### PostgreSQL

```bash
# Remove old version if not needed
brew uninstall postgresql@14

# Check running services first
brew services list
```

### General Pattern

```bash
# Remove old version without breaking dependents
brew uninstall --ignore-dependencies PACKAGE@OLD_VERSION
```

## Fixing Common Issues

### Unlinked Kegs

```bash
# Link a package
brew link PACKAGE_NAME

# Force link if conflicts exist
brew link --overwrite PACKAGE_NAME
```

### Manual Installation Conflicts

```bash
# Remove manually installed libraries in /usr/local
sudo rm /usr/local/lib/LIBRARY_NAME
sudo rm -rf /usr/local/include/HEADER_DIR
```

### Broken Casks

```bash
# Uninstall and reinstall
brew uninstall --cask CASK_NAME
brew install --cask CASK_NAME
```

## Key Concepts

### Formulae vs Casks

- **Formulae**: Command-line tools and libraries
- **Casks**: GUI applications

### Leaves vs Dependencies

- **Leaves** (`brew leaves`): Packages you explicitly installed
- **Dependencies**: Packages installed automatically to support leaves
- Only remove leaves manually; use `autoremove` for dependencies

### Version Pinning

```bash
# Prevent package from upgrading
brew pin PACKAGE_NAME

# Allow upgrades again
brew unpin PACKAGE_NAME
```

## Best Practices

1. **Before major cleanup**: Run `brew cleanup --dry-run` to preview
2. **Check dependencies**: Use `brew uses --installed` before removing anything
3. **Keep one version**: Don't keep multiple versions unless explicitly needed
4. **Ignore some warnings**: `brew doctor` warnings are often non-critical
5. **Manual installs**: Avoid installing to `/usr/local` manually; use Homebrew instead

## Troubleshooting

### After Cleanup Issues

```bash
# Reinstall missing dependencies
brew install MISSING_PACKAGE

# Reinstall package completely
brew reinstall PACKAGE_NAME

# Fix broken links
brew doctor
# Follow the specific fix suggestions
```

### Cache Location

```bash
# View cache
ls ~/Library/Caches/Homebrew

# Clear specific package cache
rm -rf ~/Library/Caches/Homebrew/PACKAGE_NAME
```

## Regular Maintenance Schedule

**Weekly/Monthly**:

```bash
brew update && brew upgrade
brew cleanup -s
brew autoremove
```

**Quarterly**:

```bash
brew doctor
# Address any deprecated packages
brew missing
# Install any missing dependencies
```
