# CommandLine OneLiner

## Clear all app-to-space assignments

```bash
# Clear all app-to-space assignments
defaults delete com.apple.spaces app-bindings
killall Dock
```

## Reset all Dock preferences (nuclear option)

Remove apps from Dock, then re-add them (they default to "None")

```bash
defaults delete com.apple.dock
killall Dock
```

## Restart Font Registration

```bash
sudo pkill -f CoreServicesUIAgent  # Restarts Font Registration
```

## Find the big/large files in a certain directory

```shell
# Including hidden files
du -sh .[!.]* * | sort -rh | head -n 10

# Files and directories in current directory
du -sh * | sort -rh | head -n 10

# 10 largest files in current directory
du -h -d 1 | sort -rh | head -n 10

# 10 largest files in /Users/username/
sudo du -h -d 1 /Users/username/ | sort -rh | head -n 10
```

## LogFiles

After Deployment via SSH

### Show

```shell
tail -f /home/LogFiles/application.log # <- replace with your log file
tail -f -n 10 /home/LogFiles/application.log # last 10 lines + follow
```

### Sort

```shell
ls -l --time-style=+%d-%m | grep `date +%d-%m` # Assumed date format: dd-mm
```

or

```shell
cd /home/LogFiles
find . -type f -mtime 0 # Files modified today
```

## Change or Add Environment Variables

```shell
echo 'export PORT=8080' >> ~/.profile
```

and restart the Web App.

## Show OS Version

```shell
cat /etc/os-release
```

## Show Architecture

```shell
uname -m
arch
```

## Kill Port

```shell
sudo kill $(sudo lsof -t -i:4200) # MacOS
sudo kill $(sudo lsof -t -i:4200) -s TCP:LISTEN # Linux
sudo fuser -k 4200/tcp # Linux

# or

sudo netstat -tulnvp | grep 4200 # detect PID
sudo kill -9 <PID>

```

## Show Running Webserver

```shell
sudo netstat -tulnvp | grep 8080 # or
sudo lsof -i -P -n | grep LISTEN # or
sudo ss -tulw # or
ps -aux | grep -E 'nginx|apache2|httpd' # or
sudo systemctl status nginx # if using systemd and nginx
```

## Command Timing

To delay the execution of a command in a Unix-based operating system like macOS, you can use the at command. The at command allows you to schedule commands to run at a specific time in the future.

Here's an example of how you could use at to schedule a command to run on a specific date and time:

```shell
at 12:00 AM Saturday
```

This will open the at prompt, where you can enter the command you want to run. After entering the command, press CTRL + D to save and exit. The scheduled command will run at the specified time.

You can also use the at command with the -f option to specify a script file that contains multiple commands. For example:

```shell
at 12:00 AM Saturday -f script.sh
```

This will run the commands contained in the script.sh file at the specified time.

Note that you need to have the proper permissions to use the at command. If you're logged in as a regular user, you may need to use sudo to run at with superuser privileges.

## Rename all files in a folder

### Search for video files containing a specific string on a specific volume or folder

```shell
# e.g. "formly"
find /Volumes/NAME_EXTERNAL_DRIVE -type f \( -iname '*formly*.mp4' -o -iname '*formly*.avi' -o -iname '*formly*.mov' -o -iname
  '*formly*.mkv' -o -iname '*formly*.flv' -o -iname '*formly*.wmv' \)
```

### Search for video files

```shell
 find /Volumes/NAME_EXTERNAL_DRIVE -type f \( -iname '*.mp4' -o -iname '*.avi' -o -iname '*.mov' -o -iname '*.mkv' -o -iname
  '*.flv' -o -iname '*.wmv' \)
```

or

```shell
find /Volumes/NAME_EXTERNAL_DRIVE -type f -iregex '.*\.\(mp4\|avi\|mov\|mkv\|flv\|wmv\)'
```

### Search and replace in file names

```shell
for file in $(find . -name '*search-sub-string*'); \
  do mv "$file" "${file/old-sub-string/search-sub-string}"; done

# shorter
for file in old-word.*; \
  do mv "$file" "${file/old-word/new-word}"; \
  done

```

### Set extension to jpg

```shell
# set extension to jpg
for f in *; do mv "$f" "$f.jpg"; done


```

## Delete all Files and Directories (including .files) in current directory

```shell
find . -mindepth 1 -delete
```

## Show only file names without extension

```shell
ls -1 | sed -e 's/\.js$//'  # in this case *.js

basename --suffix=.js -- *.js
```

## Tree on Windows (cygwin)

```powershell
C:\cygwin\bin\tree -L 2 -I 'node_modules'
```

## Convert CRLFS to LFS

```shell
find . -type f -print0 | xargs -0 dos2unix

find . -type f -print0 | xargs -0 -n 1 -P 4 dos2unix # thread
```

## Find & Delete Files/Directories (-exec)

```shell
find . -name "FILE-TO-FIND" -exec rm -rf {} \; # files & directories
find . -type f -name "FILE-TO-FIND" -exec rm -f {} \; # only files
```

## Show Directory size

### Simple Examples

```shell
du -sh */

du -h -d 1 | sort -n

find . -mindepth 1 -maxdepth 1 -type d | parallel du -s | sort -n

for entry in $(ls); do du -s "$entry"; done | sort -n
```

### A more sophisticated example

Calculate the size of files and directories in the current directory

The command `(find . -depth 1 -type f -exec ls -s {} \;; \ find . -depth 1 -type d -exec du -s {} \;)` is used to find all files and directories in the current directory and calculate their sizes.

- `find . -depth 1 -type f -exec ls -s {} \;` finds all files in the current directory and executes the `ls -s` command to display the file size in kilobytes.
- `find . -depth 1 -type d -exec du -s {} \;` finds all directories in the current directory and executes the `du -s` command to display the directory size in kilobytes.

The output of both commands is combined using the `|` (pipe) operator and sorted numerically using the `sort -n` command.

This command can be useful to quickly determine the sizes of files and directories in a directory.

```shell

(find . -depth 1 -type f -exec ls -s {} \;; \
  find . -depth 1 -type d -exec du -s {} \;) | sort -n

```

## Search for a file but exclude a directory

```shell
find . -name "FILE-TO-FIND" -not -path "./node_modules/*"

# Example
find . -name 'esbuild.config.js' -not -path './node_modules/*'
```

## Ressources

- `dscacheutil -q user` - Shows cached user records on macOS, similar to getent on Linux
- `dtrace -n 'syscall:::entry { @num[execname] = count(); }' -c 'sleep 1'` - System call profiling on macOS/BSD
- `fs_usage -f filesys ls` - Shows all filesystem operations in real-time (macOS equivalent to strace)
- `sample $PID 5 -file /tmp/profile.txt` - Quick process sampling without instruments
- `system_profiler SPHardwareDataType SPSoftwareDataType` - Detailed system info
- `sysctl -a | grep kern.maxfiles` - Shows file descriptor limits
- `lsof -i 4 -n -P | grep -i listen` - Network ports without DNS resolution
- `vmmap $PID` - Shows virtual memory layout of process
- `heap $PID` - Analyze process heap (requires developer tools)
- `leaks --atExit -- your_program` - Memory leak detection at runtime
