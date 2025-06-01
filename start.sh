#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Global variables
global_ipAddress=""
global_supabaseIP=""
global_mqttIP=""

get_ip_address() {
    local ipv4_address=""
    
    # Try different methods to get IP address
    if command -v ip >/dev/null 2>&1; then
        # Linux - try wireless first
        ipv4_address=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' | head -n1)
    elif command -v ifconfig >/dev/null 2>&1; then
        # macOS/BSD - try wireless first
        ipv4_address=$(ifconfig | grep -E "inet.*broadcast" | grep -v "127.0.0.1" | awk '{print $2}' | head -n1)
    fi
    
    # If still no IP, try hostname -I (Linux)
    if [[ -z "$ipv4_address" ]] && command -v hostname >/dev/null 2>&1; then
        ipv4_address=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    # Fallback to localhost if nothing found
    if [[ -z "$ipv4_address" ]]; then
        ipv4_address="localhost"
    fi
    
    echo "$ipv4_address"
}

get_service_ips() {
    echo -e "\n${YELLOW}=== Service IP Configuration ===${NC}"
    
    # Supabase IP
    echo -e "${CYAN}Enter Supabase IP address (press Enter for Default:$global_ipAddress):${NC}"
    read -p "Supabase IP: " supabaseInput
    
    if [[ -z "$supabaseInput" ]]; then
        global_supabaseIP="$global_ipAddress"
    else
        if [[ "$supabaseInput" =~ ^(localhost|([0-9]{1,3}\.){3}[0-9]{1,3}|[a-zA-Z0-9\.-]+)$ ]]; then
            global_supabaseIP="$supabaseInput"
        else
            echo -e "${YELLOW}Invalid IP format. Using default: $global_ipAddress${NC}"
            global_supabaseIP="$global_ipAddress"
        fi
    fi
    
    # MQTT IP
    echo -e "${CYAN}Enter MQTT/Mosquitto IP address (press Enter for Default:$global_ipAddress):${NC}"
    read -p "MQTT IP: " mqttInput
    
    if [[ -z "$mqttInput" ]]; then
        global_mqttIP="$global_ipAddress"
    else
        if [[ "$mqttInput" =~ ^(localhost|([0-9]{1,3}\.){3}[0-9]{1,3}|[a-zA-Z0-9\.-]+)$ ]]; then
            global_mqttIP="$mqttInput"
        else
            echo -e "${YELLOW}Invalid IP format. Using default: $global_ipAddress${NC}"
            global_mqttIP="$global_ipAddress"
        fi
    fi
    
    echo -e "\n${GREEN}Configuration:${NC}"
    echo -e "${WHITE}- Supabase IP: $global_supabaseIP${NC}"
    echo -e "${WHITE}- MQTT IP: $global_mqttIP${NC}"
}

update_supabase_file() {
    local supabaseFile="$(pwd)/frontend/utils/supabase.ts"
    
    if [[ -f "$supabaseFile" ]]; then
        echo -e "${YELLOW}Updating Supabase configuration with IP: $global_supabaseIP${NC}"
        
        # Use sed to replace the IP address
        if sed -i.bak "s|\(process\.env\.EXPO_PUBLIC_SUPABASE_URL\s*||\s*\"http://\)[^:]*\(:8000\"\)|\1$global_supabaseIP\2|g" "$supabaseFile"; then
            if grep -q "http://$global_supabaseIP:8000" "$supabaseFile"; then
                echo -e "${GREEN}Successfully updated Supabase URL to http://$global_supabaseIP:8000${NC}"
            else
                echo -e "${YELLOW}Warning: Supabase IP replacement may not have worked correctly${NC}"
                echo -e "${YELLOW}Please verify the content of $supabaseFile${NC}"
            fi
        else
            echo -e "${RED}Error updating Supabase file${NC}"
        fi
    else
        echo -e "${RED}Error: Could not find $supabaseFile${NC}"
    fi
}

update_mqtt_file() {
    local mqttFile="$(pwd)/frontend/app/GlobalDataProvider.tsx"
    local loginFile="$(pwd)/frontend/app/login.tsx"
    
    # Update GlobalDataProvider.tsx
    if [[ -f "$mqttFile" ]]; then
        echo -e "${YELLOW}Updating MQTT configuration in GlobalDataProvider.tsx with IP: $global_mqttIP${NC}"
        
        if sed -i.bak "s|\(const client = new Paho\.Client(\'\)[^\']*\(\', 9001,\)|\1$global_mqttIP\2|g" "$mqttFile"; then
            if grep -q "new Paho\.Client('$global_mqttIP', 9001," "$mqttFile"; then
                echo -e "${GREEN}Successfully updated MQTT client in GlobalDataProvider.tsx to use IP: $global_mqttIP${NC}"
            else
                echo -e "${YELLOW}Warning: MQTT IP replacement in GlobalDataProvider.tsx may not have worked correctly${NC}"
                echo -e "${YELLOW}Please verify the content of $mqttFile${NC}"
            fi
        else
            echo -e "${RED}Error updating MQTT file${NC}"
        fi
    else
        echo -e "${RED}Error: Could not find $mqttFile${NC}"
    fi
    
    # Update login.tsx
    if [[ -f "$loginFile" ]]; then
        echo -e "${YELLOW}Updating MQTT configuration in login.tsx with IP: $global_mqttIP${NC}"
        
        if sed -i.bak "s|\(const MQTT_HOST = '\)[^']*\(';\s*//.*\)|\1$global_mqttIP\2|g" "$loginFile"; then
            if grep -q "const MQTT_HOST = '$global_mqttIP';" "$loginFile"; then
                echo -e "${GREEN}Successfully updated MQTT_HOST in login.tsx to: $global_mqttIP${NC}"
            else
                echo -e "${YELLOW}Warning: MQTT IP replacement in login.tsx may not have worked correctly${NC}"
                echo -e "${YELLOW}Please verify the content of $loginFile${NC}"
            fi
        else
            echo -e "${RED}Error updating login file${NC}"
        fi
    else
        echo -e "${RED}Error: Could not find $loginFile${NC}"
    fi
}

backup_database() {
    echo -e "${CYAN}Creating database backup...${NC}"
    
    if [[ ! -d "./backend/data/backups" ]]; then
        mkdir -p "./backend/data/backups"
    fi
    
    if ! docker ps | grep -q "supabase-db"; then
        echo -e "${RED}Error: supabase-db container is not running${NC}"
        return 1
    fi
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backupFile="./backend/data/backups/db_backup_$timestamp.sql"
    
    echo -e "${CYAN}Backing up database to $backupFile...${NC}"
    if docker exec -t supabase-db pg_dump -U postgres -d postgres > "$backupFile"; then
        # Create zip file
        if command -v zip >/dev/null 2>&1; then
            zip "$backupFile.zip" "$backupFile" && rm "$backupFile"
        elif command -v gzip >/dev/null 2>&1; then
            gzip "$backupFile"
            mv "$backupFile.gz" "$backupFile.zip"
        fi
        
        # Copy as latest backup
        if [[ -f "./backend/data/latest_backup.zip" ]]; then
            rm "./backend/data/latest_backup.zip"
        fi
        cp "$backupFile.zip" "./backend/data/latest_backup.zip"
        
        echo -e "${GREEN}Database backup created successfully${NC}"
        echo -e "${GREEN}Backup saved to $backupFile.zip${NC}"
        return 0
    else
        echo -e "${RED}Error creating database backup${NC}"
        return 1
    fi
}

select_backup_file() {
    if [[ ! -d "./backend/data/backups" ]]; then
        mkdir -p "./backend/data/backups"
    fi
    
    local backupFiles=(./backend/data/backups/*.zip)
    if [[ ! -f "${backupFiles[0]}" ]]; then
        echo -e "${YELLOW}No backup files found${NC}"
        return 1
    fi
    
    echo -e "${CYAN}Available backup files:${NC}"
    local index=1
    for file in "${backupFiles[@]}"; do
        if [[ -f "$file" ]]; then
            local filename=$(basename "$file")
            local filedate=$(stat -c %y "$file" 2>/dev/null || stat -f %Sm "$file" 2>/dev/null || echo "unknown")
            echo "$index) $filename ($filedate)"
            ((index++))
        fi
    done
    
    read -p "Enter the number of the backup to restore (or 0 to cancel): " backupNum
    
    if [[ "$backupNum" == "0" ]]; then
        echo -e "${YELLOW}Restore canceled${NC}"
        return 1
    fi
    
    local selectedIndex=$((backupNum - 1))
    if [[ $selectedIndex -ge 0 && $selectedIndex -lt ${#backupFiles[@]} ]]; then
        local selectedFile="${backupFiles[$selectedIndex]}"
        echo -e "${GREEN}Selected backup: $selectedFile${NC}"
        echo "$selectedFile"
        return 0
    else
        echo -e "${RED}Invalid selection${NC}"
        return 1
    fi
}

restore_database_from_backup() {
    echo -e "${CYAN}Restoring database...${NC}"
    
    if ! docker ps | grep -q "supabase-db"; then
        echo -e "${RED}Error: supabase-db container is not running${NC}"
        return 1
    fi
    
    echo "Do you want to restore from:"
    echo "1) Latest backup"
    echo "2) Select from available backups"
    read -p "Enter choice (1/2): " restoreChoice
    
    local backupFile=""
    if [[ "$restoreChoice" == "1" ]]; then
        if [[ -f "./backend/data/latest_backup.zip" ]]; then
            backupFile="./backend/data/latest_backup.zip"
        else
            echo -e "${RED}No latest backup found${NC}"
            return 1
        fi
    elif [[ "$restoreChoice" == "2" ]]; then
        backupFile=$(select_backup_file)
        if [[ $? -ne 0 ]]; then
            return 1
        fi
    else
        echo -e "${RED}Invalid choice${NC}"
        return 1
    fi

    echo -e "${CYAN}Waiting for database to be ready...${NC}"
    local ready=false
    local attempts=0
    while [[ "$ready" == false && $attempts -lt 12 ]]; do
        if docker exec -t supabase-db pg_isready -U postgres >/dev/null 2>&1; then
            ready=true
            echo -e "${GREEN}Database is ready${NC}"
        else
            echo -n "."
            sleep 5
            ((attempts++))
        fi
    done
    
    if [[ "$ready" == false ]]; then
        echo -e "${YELLOW}Database not ready after 60 seconds. Continuing anyway...${NC}"
    fi
    
    local tempSqlFile="./backend/data/temp_restore.sql"
    
    # Extract backup file
    if command -v unzip >/dev/null 2>&1; then
        unzip -o "$backupFile" -d "./backend/data/"
    elif command -v gunzip >/dev/null 2>&1; then
        cp "$backupFile" "$tempSqlFile.gz"
        gunzip "$tempSqlFile.gz"
    fi
    
    # Find extracted SQL file
    local extractedFile=$(find "./backend/data/" -name "*.sql" -not -name "temp_restore.sql" | head -n1)
    if [[ -n "$extractedFile" ]]; then
        mv "$extractedFile" "$tempSqlFile"
    fi
    
    echo -e "${CYAN}Restoring from $backupFile...${NC}"
    if docker exec -i supabase-db psql -U postgres -d postgres < "$tempSqlFile"; then
        rm -f "$tempSqlFile"
        echo -e "${GREEN}Database restored successfully${NC}"
        return 0
    else
        rm -f "$tempSqlFile"
        echo -e "${RED}Error restoring database${NC}"
        return 1
    fi
}

start_supabase() {
    echo -e "${CYAN}Starting Supabase services...${NC}"
    pushd "./backend/supabase-project" > /dev/null
    docker compose up -d
    popd > /dev/null
    echo -e "${GREEN}Supabase services started${NC}"

    if [[ -f "./backend/data/backups/"*.zip ]] || [[ -f "./backend/data/latest_backup.zip" ]]; then
        echo -e "${CYAN}Database backups found.${NC}"
        read -p "Do you want to restore the database from a backup? (y/n): " restoreDb
        if [[ "$restoreDb" == "y" || "$restoreDb" == "Y" ]]; then
            restore_database_from_backup
        else
            echo -e "${YELLOW}Skipping database restore.${NC}"
        fi
    fi
}

configure_frontend() {
    local platform="$1"
    local homeFile="./app/(authenticated)/(tabs)/home.tsx"
    local activityFile="./app/(authenticated)/(tabs)/activity.tsx"
    
    echo -e "${CYAN}Configuring health data files for platform: $platform${NC}"
    
    # Configure home.tsx
    if [[ -f "$homeFile" ]]; then
        echo -e "${YELLOW}Configuring home.tsx for $platform...${NC}"
        
        case "$platform" in
            "ios")
                # iOS import configuration
                sed -i.bak 's|^//\s*import useHealthDataios|import useHealthDataios|g' "$homeFile"
                sed -i.bak 's|^import useHealthData from|//import useHealthData from|g' "$homeFile"
                
                # iOS hook configuration
                sed -i.bak 's|^\s*//\s*const iosHealthData|  const iosHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*const androidHealthData|  //const androidHealthData|g' "$homeFile"
                
                # Set initial values to 0
                sed -i.bak 's|let sleep = [^,;]*|let sleep = 0|g' "$homeFile"
                sed -i.bak 's|let calories = [^;]*|let calories = 0|g' "$homeFile"
                
                # iOS assignments (uncomment)
                sed -i.bak 's|^\s*//\s*sleep = iosHealthData|    sleep = iosHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*//\s*calories = iosHealthData|    calories = iosHealthData|g' "$homeFile"
                
                # Android assignments (comment)
                sed -i.bak 's|^\s*sleep = androidHealthData|    //sleep = androidHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*calories = androidHealthData|    //calories = androidHealthData|g' "$homeFile"
                ;;
                
            "android")
                # Android import configuration
                sed -i.bak 's|^import useHealthDataios|//import useHealthDataios|g' "$homeFile"
                sed -i.bak 's|^//\s*import useHealthData from|import useHealthData from|g' "$homeFile"
                
                # Android hook configuration
                sed -i.bak 's|^\s*const iosHealthData|  //const iosHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*//\s*const androidHealthData|  const androidHealthData|g' "$homeFile"
                
                # Set initial values to 0
                sed -i.bak 's|let sleep = [^,;]*|let sleep = 0|g' "$homeFile"
                sed -i.bak 's|let calories = [^;]*|let calories = 0|g' "$homeFile"
                
                # Android assignments (uncomment)
                sed -i.bak 's|^\s*//\s*sleep = androidHealthData|    sleep = androidHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*//\s*calories = androidHealthData|    calories = androidHealthData|g' "$homeFile"
                
                # iOS assignments (comment)
                sed -i.bak 's|^\s*sleep = iosHealthData|    //sleep = iosHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*calories = iosHealthData|    //calories = iosHealthData|g' "$homeFile"
                ;;
                
            "expo")
                # Comment all imports
                sed -i.bak 's|^import useHealthDataios|//import useHealthDataios|g' "$homeFile"
                sed -i.bak 's|^import useHealthData from|//import useHealthData from|g' "$homeFile"
                
                # Comment all hooks
                sed -i.bak 's|^\s*const iosHealthData|  //const iosHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*const androidHealthData|  //const androidHealthData|g' "$homeFile"
                
                # Set mock values
                sed -i.bak 's|let sleep = [^,;]*|let sleep = 3.5|g' "$homeFile"
                sed -i.bak 's|let calories = [^;]*|let calories = 274|g' "$homeFile"
                
                # Comment all assignments
                sed -i.bak 's|^\s*sleep = iosHealthData|    //sleep = iosHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*calories = iosHealthData|    //calories = iosHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*sleep = androidHealthData|    //sleep = androidHealthData|g' "$homeFile"
                sed -i.bak 's|^\s*calories = androidHealthData|    //calories = androidHealthData|g' "$homeFile"
                ;;
        esac
        echo -e "${GREEN}home.tsx configured successfully${NC}"
    else
        echo -e "${RED}Warning: $homeFile not found${NC}"
    fi
    
    # Configure activity.tsx
    if [[ -f "$activityFile" ]]; then
        echo -e "${YELLOW}Configuring activity.tsx for $platform...${NC}"
        
        case "$platform" in
            "ios")
                # iOS import configuration
                sed -i.bak 's|^//\s*import useHealthDataios|import useHealthDataios|g' "$activityFile"
                sed -i.bak 's|^import useHealthData from|//import useHealthData from|g' "$activityFile"
                
                # iOS hook configuration
                sed -i.bak 's|^\s*//\s*const iosHealthData|      const iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*const androidHealthData|      //const androidHealthData|g' "$activityFile"
                
                # Set initial values to 0
                sed -i.bak 's|let steps = [^,;]*, flights = [^,;]*, distance = [^;]*|let steps = 0, flights = 0, distance = 0|g' "$activityFile"
                
                # iOS assignments (uncomment)
                sed -i.bak 's|^\s*//\s*steps = iosHealthData|      steps = iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*//\s*flights = iosHealthData|      flights = iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*//\s*distance = iosHealthData|      distance = iosHealthData|g' "$activityFile"
                
                # Android assignments (comment)
                sed -i.bak 's|^\s*steps = androidHealthData|      //steps = androidHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*flights = androidHealthData|      //flights = androidHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*distance = androidHealthData|      //distance = androidHealthData|g' "$activityFile"
                ;;
                
            "android")
                # Android import configuration
                sed -i.bak 's|^import useHealthDataios|//import useHealthDataios|g' "$activityFile"
                sed -i.bak 's|^//\s*import useHealthData from|import useHealthData from|g' "$activityFile"
                
                # Android hook configuration
                sed -i.bak 's|^\s*const iosHealthData|      //const iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*//\s*const androidHealthData|      const androidHealthData|g' "$activityFile"
                
                # Set initial values to 0
                sed -i.bak 's|let steps = [^,;]*, flights = [^,;]*, distance = [^;]*|let steps = 0, flights = 0, distance = 0|g' "$activityFile"
                
                # Android assignments (uncomment)
                sed -i.bak 's|^\s*//\s*steps = androidHealthData|      steps = androidHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*//\s*flights = androidHealthData|      flights = androidHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*//\s*distance = androidHealthData|      distance = androidHealthData|g' "$activityFile"
                
                # iOS assignments (comment)
                sed -i.bak 's|^\s*steps = iosHealthData|      //steps = iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*flights = iosHealthData|      //flights = iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*distance = iosHealthData|      //distance = iosHealthData|g' "$activityFile"
                ;;
                
            "expo")
                # Comment all imports
                sed -i.bak 's|^import useHealthDataios|//import useHealthDataios|g' "$activityFile"
                sed -i.bak 's|^import useHealthData from|//import useHealthData from|g' "$activityFile"
                
                # Comment all hooks
                sed -i.bak 's|^\s*const iosHealthData|      //const iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*const androidHealthData|      //const androidHealthData|g' "$activityFile"
                
                # Set mock values
                sed -i.bak 's|let steps = [^,;]*, flights = [^,;]*, distance = [^;]*|let steps = 18074, flights = 8.4, distance = 1042|g' "$activityFile"
                
                # Comment all assignments
                sed -i.bak 's|^\s*steps = iosHealthData|      //steps = iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*flights = iosHealthData|      //flights = iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*distance = iosHealthData|      //distance = iosHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*steps = androidHealthData|      //steps = androidHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*flights = androidHealthData|      //flights = androidHealthData|g' "$activityFile"
                sed -i.bak 's|^\s*distance = androidHealthData|      //distance = androidHealthData|g' "$activityFile"
                ;;
        esac
        echo -e "${GREEN}activity.tsx configured successfully${NC}"
    else
        echo -e "${RED}Warning: $activityFile not found${NC}"
    fi
}

start_frontend() {
    echo -e "${CYAN}Frontend Platform Selection${NC}"

    local frontendPath="$(pwd)/frontend"
    
    # Update Supabase configuration
    update_supabase_file
    
    # Update MQTT configuration
    update_mqtt_file

    # Platform selection
    echo -e "\n${YELLOW}Select platform to run:${NC}"
    echo -e "${CYAN}1) iOS (native)${NC}"
    echo -e "${CYAN}2) Expo Go (Docker container)${NC}"
    echo -e "${CYAN}3) Android (native)${NC}"
    
    read -p "Enter choice (1-3): " platformChoice
    
    case "$platformChoice" in
        "1")
            echo -e "${GREEN}Starting Expo for iOS (native)...${NC}"
            
            # Change to frontend directory and configure
            pushd "$frontendPath" > /dev/null
            configure_frontend "ios"
            popd > /dev/null
            
            # Start in new terminal if possible
            if command -v gnome-terminal >/dev/null 2>&1; then
                gnome-terminal -- bash -c "cd '$frontendPath' && npx expo start --ios; exec bash"
            elif command -v xterm >/dev/null 2>&1; then
                xterm -e "cd '$frontendPath' && npx expo start --ios; exec bash" &
            else
                echo -e "${YELLOW}Starting Expo in current terminal...${NC}"
                cd "$frontendPath" && npx expo start --ios
            fi
            
            echo -e "${GREEN}iOS native Expo started${NC}"
            ;;
            
        "2")
            echo -e "${GREEN}Starting Expo Go in Docker container...${NC}"
            
            pushd "$frontendPath" > /dev/null
            configure_frontend "expo"
            popd > /dev/null
            
            export PLATFORM="expo"
            export SUPABASE_IP="$global_supabaseIP"
            export MQTT_IP="$global_mqttIP"
            export HOST_IP="$global_ipAddress"

            if ! docker version >/dev/null 2>&1; then
                echo -e "${RED}Error: Docker is not running or not installed${NC}"
                echo -e "${YELLOW}Please start Docker and try again${NC}"
                return 1
            fi
            
            local dockerComposeFile="$(pwd)/docker-compose-frontend.yml"
            if [[ ! -f "$dockerComposeFile" ]]; then
                echo -e "${CYAN}Creating Docker Compose file...${NC}"
            fi

            echo -e "${CYAN}Building and starting Docker container...${NC}"
            
            if docker-compose -f docker-compose-frontend.yml up --build; then
                echo -e "${GREEN}Expo Go Docker container started${NC}"
                echo -e "${CYAN}Access the app at: http://$global_ipAddress:8200${NC}"
                echo -e "${CYAN}Use the Expo Go app to scan the QR code${NC}"
            else
                echo -e "${RED}Error starting Docker container${NC}"
                echo -e "${YELLOW}Make sure Docker is running and try again${NC}"
            fi
            ;;
            
        "3")
            echo -e "${GREEN}Starting Expo for Android (native)...${NC}"
            pushd "$frontendPath" > /dev/null
            configure_frontend "android"
            popd > /dev/null
            
            # Start in new terminal if possible
            if command -v gnome-terminal >/dev/null 2>&1; then
                gnome-terminal -- bash -c "cd '$frontendPath' && npx expo start --android; exec bash"
            elif command -v xterm >/dev/null 2>&1; then
                xterm -e "cd '$frontendPath' && npx expo start --android; exec bash" &
            else
                echo -e "${YELLOW}Starting Expo in current terminal...${NC}"
                cd "$frontendPath" && npx expo start --android
            fi
            
            echo -e "${GREEN}Android native Expo started${NC}"
            echo -e "${YELLOW}Note: If you need to navigate to a specific screen for Android testing,${NC}"
            echo -e "${YELLOW}you can manually navigate to: frontend/app/(authenticated)/(tabs)${NC}"
            ;;
            
        *)
            echo -e "${YELLOW}Invalid choice. Starting Expo Go in Docker container as default...${NC}"
            
            pushd "$frontendPath" > /dev/null
            configure_frontend "expo"
            popd > /dev/null

            export PLATFORM="expo"
            export SUPABASE_IP="$global_supabaseIP"
            export MQTT_IP="$global_mqttIP"
            export HOST_IP="$global_ipAddress"

            echo -e "${CYAN}Building and starting Docker container...${NC}"
            
            if docker-compose -f docker-compose-frontend.yml up --build; then
                echo -e "${GREEN}Expo Go Docker container started${NC}"
            else
                echo -e "${RED}Error starting Docker container${NC}"
            fi
            ;;
    esac
}

start_extras() {
    echo -e "${CYAN}Starting Extra services...${NC}"
    
    # Start Mosquitto
    echo -e "${CYAN}Starting Mosquitto service...${NC}"
    pushd "./mosquitto" > /dev/null
    if docker compose up -d; then
        echo -e "${GREEN}Mosquitto service started successfully${NC}"
    else
        echo -e "${RED}Error starting Mosquitto${NC}"
    fi
    popd > /dev/null
    
    echo -e "${CYAN}Starting Face Authentication service...${NC}"
    pushd "./extensions/face_auth" > /dev/null
    
    local supabaseURL="http://$global_supabaseIP:8000"
    
    # Update .env file
    if [[ -f ".env" ]]; then
        echo -e "${YELLOW}Updating .env with Supabase URL: $supabaseURL${NC}"
        sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=$supabaseURL|g" .env
        
        if docker compose up -d; then
            echo -e "${GREEN}Face Authentication service started successfully${NC}"
        else
            echo -e "${RED}Error starting Face Authentication${NC}"
        fi
    else
        echo -e "${RED}Error: .env file not found in face_auth directory${NC}"
    fi
    popd > /dev/null
    
    echo -e "${GREEN}Extra services started${NC}"
}

restart_backend() {
    echo -e "${CYAN}Restarting backend...${NC}"
    pushd "./backend/supabase-project" > /dev/null
    docker compose down
    docker compose up -d
    popd > /dev/null
    echo -e "${GREEN}Backend restarted.${NC}"
}

restart_extras() {
    echo -e "${CYAN}Restarting extra services...${NC}"
    pushd "./mosquitto" > /dev/null
    docker compose down
    docker compose up -d
    popd > /dev/null
    echo -e "${GREEN}Successfully restarted MQTT${NC}"
    
    pushd "./extensions/face_auth" > /dev/null
    docker compose down
    local supabaseURL="http://$global_supabaseIP:8000"
    export SUPABASE_URL="$supabaseURL"
    export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"
    docker compose up -d
    popd > /dev/null
    echo -e "${GREEN}Successfully restarted Face Auth${NC}"
    echo -e "${GREEN}Extra services restarted.${NC}"
}

restart_frontend() {
    echo -e "${CYAN}Restarting frontend...${NC}"
    start_frontend
    echo -e "${GREEN}Frontend restarted.${NC}"
}

# Main script execution
clear
echo -e "${GREEN}Starting development environment...${NC}"

if [[ ! -d "./frontend" ]]; then
    echo -e "${RED}Frontend directory not found. Please run this script from the project root.${NC}"
    exit 1
fi

if [[ ! -d "./backend/supabase-project" ]]; then
    echo -e "${RED}Supabase project directory not found. Please check the path: backend/supabase-project${NC}"
    exit 1
fi

if [[ ! -d "./backend/data" ]]; then
    echo -e "${CYAN}Creating backend/data directory for database backups...${NC}"
    mkdir -p "./backend/data"
fi

global_ipAddress=$(get_ip_address)
if [[ -n "$global_ipAddress" ]]; then
    echo -e "${GREEN}Detected IP address: $global_ipAddress${NC}"
    export REACT_NATIVE_PACKAGER_HOSTNAME="$global_ipAddress"
    echo -e "${GREEN}Environment variable set: REACT_NATIVE_PACKAGER_HOSTNAME=$global_ipAddress${NC}"
else
    echo -e "${RED}Could not detect IP address${NC}"
    exit 1
fi

# Get service IP configurations
get_service_ips

echo ""
read -p "Do you want to start the Supabase backend? (y/n): " startBackend
if [[ "$startBackend" == "y" || "$startBackend" == "Y" ]]; then
    start_supabase
else
    echo -e "${YELLOW}Skipping Supabase backend.${NC}"
fi

echo ""
echo -e "${WHITE}Extra services available:${NC}"
echo -e "${WHITE} - MQTT docker service${NC}"
echo -e "${WHITE} - Face Auth service${NC}"
read -p "Do you want to start the extra services? (y/n): " startExtras
if [[ "$startExtras" == "y" || "$startExtras" == "Y" ]]; then
    start_extras
else
    echo -e "${YELLOW}Skipping Extra services.${NC}"
fi

echo ""
read -p "Do you want to start the Expo frontend? (y/n): " startFrontend
if [[ "$startFrontend" == "y" || "$startFrontend" == "Y" ]]; then
    start_frontend
else
    update_supabase_file
    update_mqtt_file
    echo -e "${YELLOW}Skipping Expo frontend.${NC}"
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${CYAN}- Expo is available at http://$global_ipAddress:8081${NC}"
echo -e "${CYAN}- Supabase Studio is available at http://localhost:8000${NC}"
echo -e "${CYAN}- Supabase API configured for: http://$global_supabaseIP:8000${NC}"
echo -e "${CYAN}- MQTT configured for: $global_mqttIP:9001${NC}"
echo ""
echo -e "${CYAN}To view logs:${NC}"
echo -e "${CYAN}- Frontend: docker compose logs -f expo-app${NC}"
echo -e "${CYAN}- Supabase: cd backend/supabase-project && docker compose logs -f${NC}"

while true; do
    echo ""
    echo -e "${CYAN}Do you want to quit or continue${NC}"
    echo -e "${CYAN}- q - quit,${NC}"
    echo -e "${CYAN}- r - restart,${NC}"
    echo -e "${CYAN}- rf - restart frontend,${NC}"
    echo -e "${CYAN}- rb - restart backend,${NC}"
    echo -e "${CYAN}- re - restart extras,${NC}"
    read -p "or press any key to continue: " option
    
    if [[ "$option" == "q" ]]; then
        read -p "Would you like to create a database backup before shutting down? (y/n): " createBackup
        if [[ "$createBackup" == "y" || "$createBackup" == "Y" ]]; then
            backup_database
        fi
        
        echo -e "${CYAN}Shutting down all services...${NC}"
        pushd "./frontend" > /dev/null
        docker compose down 2>/dev/null || true
        popd > /dev/null
        
        pushd "./backend/supabase-project" > /dev/null
        docker compose down 2>/dev/null || true
        popd > /dev/null

        pushd "./mosquitto" > /dev/null
        docker compose down 2>/dev/null || true
        popd > /dev/null
        
        pushd "./extensions/face_auth" > /dev/null
        docker compose down 2>/dev/null || true
        popd > /dev/null
        
        echo -e "${GREEN}Shutdown complete. Exiting...${NC}"
        break
    elif [[ "$option" == "rb" ]]; then
        restart_backend
    elif [[ "$option" == "rf" ]]; then
        restart_frontend
    elif [[ "$option" == "re" ]]; then
        restart_extras
    elif [[ "$option" == "r" ]]; then
        echo -e "${CYAN}Restarting all services...${NC}"
        restart_frontend
        restart_backend
        restart_extras
    else
        echo -e "${CYAN}Continuing development...${NC}"
    fi
done