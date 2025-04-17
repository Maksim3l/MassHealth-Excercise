#!/bin/bash

# Function to get IP address on Windows
get_ip_windows() {
  ipv4_address=$(ipconfig | grep -A 5 "Wireless LAN adapter Wi-Fi" | grep "IPv4 Address" | awk -F: '{print $2}' | tr -d ' ')
  if [ -z "$ipv4_address" ]; then
    ipv4_address=$(ipconfig | grep -A 5 "Wireless LAN adapter Wireless Network Connection" | grep "IPv4 Address" | awk -F: '{print $2}' | tr -d ' ')
  fi
  
  echo $ipv4_address
}

get_ip_linux() {
  ipv4_address=$(ip addr show | grep -E "wlan0|wlp|wifi" | grep "inet " | awk '{print $2}' | cut -d/ -f1)
  if [ -z "$ipv4_address" ]; then
    ipv4_address=$(ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | head -n 1)
  fi
  
  echo $ipv4_address
}

get_ip_mac() {
  ipv4_address=$(ipconfig getifaddr en0)
  if [ -z "$ipv4_address" ]; then
    ipv4_address=$(ipconfig getifaddr en1)
  fi
  
  echo $ipv4_address
}


if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Detected macOS system"
  ip_address=$(get_ip_mac)

  if [ ! -z "$ip_address" ]; then
    echo "WiFi IP address: $ip_address"
    export REACT_NATIVE_PACKAGER_HOSTNAME=$ip_address
    echo "export REACT_NATIVE_PACKAGER_HOSTNAME=$ip_address" >> ~/.bash_profile
    echo "Environment variable set for current session and added to ~/.bash_profile"
  else
    echo "Could not detect WiFi IP address"
    exit 1
  fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  echo "Detected Windows system"
  ip_address=$(get_ip_windows)
  
  if [ ! -z "$ip_address" ]; then
    echo "WiFi IP address: $ip_address"
    cmd.exe /c "setx /M REACT_NATIVE_PACKAGER_HOSTNAME $ip_address"
  else
    echo "Could not detect WiFi IP address"
    exit 1
  fi
else
  echo "Detected Linux system"
  ip_address=$(get_ip_linux)
  
  if [ ! -z "$ip_address" ]; then
    echo "WiFi IP address: $ip_address"
    export REACT_NATIVE_PACKAGER_HOSTNAME=$ip_address
    echo "export REACT_NATIVE_PACKAGER_HOSTNAME=$ip_address" >> ~/.bashrc
    echo "Environment variable set for current session and added to ~/.bashrc"
  else
    echo "Could not detect WiFi IP address"
    exit 1
  fi
fi

if [ -d "frontend" ]; then
  cd frontend
else
  echo "Frontend directory not found. Please run this script from the project root."
  exit 1
fi

# Run npm install in a new terminal
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  start cmd.exe /c "cd $(pwd) && npm i && echo 'Dependencies installed, starting Expo...' && npx expo start"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  osascript <<EOF
  tell application "Terminal"
  do script "cd $(pwd) && npm i && echo 'Dependencies installed, starting Expo...' && npx expo start"
  end tell
EOF
else
  gnome-terminal -- bash -c "cd $(pwd) && npm i && echo 'Dependencies installed, starting Expo...' && npx expo start; exec bash" || \
  xterm -e "cd $(pwd) && npm i && echo 'Dependencies installed, starting Expo...' && npx expo start; exec bash" || \
  konsole -e "cd $(pwd) && npm i && echo 'Dependencies installed, starting Expo...' && npx expo start; exec bash" || \
  echo "Could not open a new terminal. Please run 'npm i && npx expo start' manually."
fi

echo "Setup complete!"