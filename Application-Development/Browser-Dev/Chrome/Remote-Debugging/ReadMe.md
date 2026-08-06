# VSCode Remote Debugging with Chrome (MacOS)

## Steps

1. mkdir -p /Applications/Chrome\ Debugger.app/Contents/MacOS
1. cd /Applications/Chrome\ Debugger.app/Contents/MacOS
1. code Chrome\ Debugger
1. Edit & save: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222&`
1. sudo chmod +x Chrome\ Debugger
1. `zshrc` &rarr; `alias chromed="/Applications/Chrome\ Debugger.app/Contents/MacOS/Chrome\ Debugger&`"
