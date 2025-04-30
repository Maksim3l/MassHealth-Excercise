#!/bin/bash

get_ip_windows() {
  ipv4_address=$(ipconfig | grep -A 5 "Wireless LAN adapter" | grep "IPv4 Address" | awk -F: '{print $2}' | tr -d ' ')
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
    setx REACT_NATIVE_PACKAGER_HOSTNAME $ip_address
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

if [ ! -d "frontend" ]; then
  echo "Frontend directory not found. Please run this script from the project root."
  exit 1
fi

if [ ! -d "backend/supabase-project" ]; then
  echo "Supabase project directory not found. Please check the path: backend/supabase-project"
  exit 1
fi

run_supabase() {
  echo "Starting Supabase services..."
  cd backend/supabase-project
  docker compose up -d
  cd ../../
  echo "Supabase services started"
}

run_frontend() {
  echo "Starting frontend with Docker Compose..."
  cd frontend
  
  if [ ! -f "Dockerfile" ]; then
    echo "Creating Dockerfile for Expo..."
    cat > Dockerfile << 'DOCKEREOF'
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 19000 19001 19002 19006 8081

ENV WATCHPACK_POLLING=true

CMD ["npx", "expo", "start", "--host", "lan"]
DOCKEREOF
  fi
  
  if [ ! -f "docker-compose.yml" ]; then
    echo "Creating docker-compose.yml for Expo..."
    
    cat > docker-compose.yml << COMPOSEEOF
version: '3'

services:
  expo-app:
    build: .
    ports:
      - "19000:19000"
      - "19001:19001"
      - "19002:19002"
      - "19006:19006"
      - "8081:8081" 
    environment:
      - WATCHPACK_POLLING=true
      - REACT_NATIVE_PACKAGER_HOSTNAME=${REACT_NATIVE_PACKAGER_HOSTNAME}
      - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    command: npx expo start --host lan
    tty: true
    stdin_open: true

volumes:
  node_modules:
COMPOSEEOF
  fi
  
  REACT_NATIVE_PACKAGER_HOSTNAME=$ip_address docker compose up -d
  
  cd ../
  echo "Frontend container started"
}

# Main execution
echo "Starting development environment..."

echo ""
read -p "Do you want to start the Supabase backend? (y/n): " start_backend
if [[ "$start_backend" =~ ^[Yy]$ ]]; then
  run_supabase
else
  echo "Skipping Supabase backend."
fi

echo ""
read -p "Do you want to start the Expo frontend? (y/n): " start_frontend
if [[ "$start_frontend" =~ ^[Yy]$ ]]; then
  run_frontend
else
  echo "Skipping Expo frontend."
fi

echo "Setup complete! Both Supabase and Expo frontend are running."
echo "- Expo is available at http://$ip_address:8081"
echo "- Supabase Studio is available at http://localhost:8000"
echo ""
echo "To view logs:"
echo "- Frontend: docker compose logs -f -f expo-app"
echo "- Supabase: cd backend/supabase-project && docker compose logs -f"

while true; do
  echo ""
  echo "Do you want to quit or continue"
  echo "- q - quit,"
  echo "- r - restart,"
  echo "- rf - restart frontend,"
  echo "- rb - restart backend,"
  read -p "or press any key to continue: " option
  if [[ "$option" == "q" ]]; then
    echo "Shutting down both frontend and backend..."
    cd frontend && docker compose down
    cd ..
    cd backend/supabase-project && docker compose down 
    cd ../../
    echo "Shutdown complete. Exiting..."
    break
  elif [[ "$option" == "rb" ]]; then
    echo "Restarting backend..."
    cd backend/supabase-project && docker compose down && docker compose up -d 
    cd ../../
    echo "Backend restarted."
  elif [[ "$option" == "rf" ]]; then
    echo "Restarting frontend..."
    cd frontend && docker compose down && docker compose up -d 
    cd ../
    echo "Frontend restarted."
  elif [[ "$option" == "r" ]]; then
    echo "Restarting both frontend and backend..."

    cd frontend && docker compose down && docker compose up -d && cd ../
    echo "Frontend restarted."

    cd backend/supabase-project && docker compose down && docker compose up -d && cd ../../
    echo "Backend restarted."
  else
    echo "Continuing development..."
  fi
done