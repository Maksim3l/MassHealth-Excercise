function Get-IPAddress {
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    foreach ($adapter in $adapters) {
        $ipAddresses = Get-NetIPAddress -InterfaceIndex $adapter.ifIndex -AddressFamily IPv4
        foreach ($ip in $ipAddresses) {
            if ($ip.IPAddress -ne "127.0.0.1") {
                return $ip.IPAddress
            }
        }
    }
    return $null
}

function Backup-Database {
    Write-Host "Creating database backup..." -ForegroundColor Cyan
    
    if (-not (Test-Path -Path ".\backend\data\backups")) {
        New-Item -Path ".\backend\data\backups" -ItemType Directory -Force | Out-Null
    }
    
    $isRunning = docker ps | Select-String -Pattern "supabase-db"
    if (-not $isRunning) {
        Write-Host "Error: supabase-db container is not running" -ForegroundColor Red
        return $false
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = ".\backend\data\backups\db_backup_$timestamp.sql"
    
    Write-Host "Backing up database to $backupFile..." -ForegroundColor Cyan
    docker exec -t supabase-db pg_dump -U postgres -d postgres > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
        Remove-Item -Path $backupFile -Force
        
        if (Test-Path -Path ".\backend\data\latest_backup.zip") {
            Remove-Item -Path ".\backend\data\latest_backup.zip" -Force
        }
        Copy-Item -Path "$backupFile.zip" -Destination ".\backend\data\latest_backup.zip" -Force
        
        Write-Host "Database backup created successfully" -ForegroundColor Green
        Write-Host "Backup saved to $backupFile.zip" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Error creating database backup" -ForegroundColor Red
        return $false
    }
}

function Select-BackupFile {
    if (-not (Test-Path -Path ".\backend\data\backups")) {
        New-Item -Path ".\backend\data\backups" -ItemType Directory -Force | Out-Null
    }
    
    $backupFiles = Get-ChildItem -Path ".\backend\data\backups\*.zip" -ErrorAction SilentlyContinue
    if ($backupFiles.Count -eq 0) {
        Write-Host "No backup files found" -ForegroundColor Yellow
        return $null
    }
    
    Write-Host "Available backup files:" -ForegroundColor Cyan
    $index = 1
    foreach ($file in ($backupFiles | Sort-Object LastWriteTime -Descending)) {
        Write-Host "$index) $($file.Name) ($($file.LastWriteTime))"
        $index++
    }
    
    $backupNum = Read-Host "Enter the number of the backup to restore (or 0 to cancel)"
    
    if ($backupNum -eq 0) {
        Write-Host "Restore canceled" -ForegroundColor Yellow
        return $null
    }
    
    $selectedIndex = [int]$backupNum - 1
    if ($selectedIndex -ge 0 -and $selectedIndex -lt $backupFiles.Count) {
        $sortedFiles = $backupFiles | Sort-Object LastWriteTime -Descending
        $selectedFile = $sortedFiles[$selectedIndex].FullName
        Write-Host "Selected backup: $selectedFile" -ForegroundColor Green
        return $selectedFile
    } else {
        Write-Host "Invalid selection" -ForegroundColor Red
        return $null
    }
}

function Restore-DatabaseFromBackup {
    Write-Host "Restoring database..." -ForegroundColor Cyan
    
    $isRunning = docker ps | Select-String -Pattern "supabase-db"
    if (-not $isRunning) {
        Write-Host "Error: supabase-db container is not running" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Do you want to restore from:"
    Write-Host "1) Latest backup"
    Write-Host "2) Select from available backups"
    $restoreChoice = Read-Host "Enter choice (1/2)"
    
    $backupFile = $null
    if ($restoreChoice -eq "1") {
        if (Test-Path -Path ".\backend\data\latest_backup.zip") {
            $backupFile = ".\backend\data\latest_backup.zip"
        } else {
            Write-Host "No latest backup found" -ForegroundColor Red
            return $false
        }
    } elseif ($restoreChoice -eq "2") {
        $backupFile = Select-BackupFile
        if (-not $backupFile) {
            return $false
        }
    } else {
        Write-Host "Invalid choice" -ForegroundColor Red
        return $false
    }

    Write-Host "Waiting for database to be ready..." -ForegroundColor Cyan
    $ready = $false
    $attempts = 0
    while (-not $ready -and $attempts -lt 12) {
        $pgIsReady = docker exec -t supabase-db pg_isready -U postgres 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            Write-Host "Database is ready" -ForegroundColor Green
        } else {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 5
            $attempts++
        }
    }
    
    if (-not $ready) {
        Write-Host "Database not ready after 60 seconds. Continuing anyway..." -ForegroundColor Yellow
    }
    
    $tempSqlFile = ".\backend\data\temp_restore.sql"
    Expand-Archive -Path $backupFile -DestinationPath ".\backend\data\" -Force
    $extractedFile = (Get-ChildItem -Path ".\backend\data\*.sql" | Select-Object -First 1).FullName
    Move-Item -Path $extractedFile -Destination $tempSqlFile -Force
    
    Write-Host "Restoring from $backupFile..." -ForegroundColor Cyan
    Get-Content $tempSqlFile | docker exec -i supabase-db psql -U postgres -d postgres
    
    Remove-Item -Path $tempSqlFile -Force -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database restored successfully" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Error restoring database" -ForegroundColor Red
        return $false
    }
}

function Start-Supabase {
    Write-Host "Starting Supabase services..." -ForegroundColor Cyan
    Push-Location ".\backend\supabase-project"
    docker compose up -d
    Pop-Location
    Write-Host "Supabase services started" -ForegroundColor Green

    if ((Test-Path -Path ".\backend\data\backups\*.zip") -or (Test-Path -Path ".\backend\data\latest_backup.zip")) {
        Write-Host "Database backups found." -ForegroundColor Cyan
        $restoreDb = Read-Host "Do you want to restore the database from a backup? (y/n)"
        if ($restoreDb -eq "y" -or $restoreDb -eq "Y") {
            Restore-DatabaseFromBackup
        } else {
            Write-Host "Skipping database restore." -ForegroundColor Yellow
        }
    }
}

function Start-Frontend {
    Write-Host "Starting frontend with Docker Compose..." -ForegroundColor Cyan
    Push-Location ".\frontend"
    
    if (-not (Test-Path -Path ".\Dockerfile")) {
        Write-Host "Creating Dockerfile for Expo..." -ForegroundColor Cyan
        @"
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 19000 19001 19002 19006 8081

ENV WATCHPACK_POLLING=true

CMD ["npx", "expo", "start", "--host", "lan"]
"@ | Set-Content -Path ".\Dockerfile"
    }
    
    if (-not (Test-Path -Path ".\docker-compose.yml")) {
        Write-Host "Creating docker-compose.yml for Expo..." -ForegroundColor Cyan
        @"
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
      - REACT_NATIVE_PACKAGER_HOSTNAME=$global:ipAddress
      - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    command: npx expo start --host lan
    tty: true
    stdin_open: true

volumes:
  node_modules:
"@ | Set-Content -Path ".\docker-compose.yml"
    }
    
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $global:ipAddress
    docker compose up -d
    
    Pop-Location
    Write-Host "Frontend container started" -ForegroundColor Green
}

function Restart-Backend {
    Write-Host "Restarting backend..." -ForegroundColor Cyan
    Push-Location ".\backend\supabase-project"
    docker compose down
    docker compose up -d
    Pop-Location
    Write-Host "Backend restarted." -ForegroundColor Green
}

function Restart-Frontend {
    Write-Host "Restarting frontend..." -ForegroundColor Cyan
    Push-Location ".\frontend"
    docker compose down
    docker compose up -d
    Pop-Location
    Write-Host "Frontend restarted." -ForegroundColor Green
}

Clear-Host
Write-Host "Starting development environment..." -ForegroundColor Green

if (-not (Test-Path -Path ".\frontend")) {
    Write-Host "Frontend directory not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path -Path ".\backend\supabase-project")) {
    Write-Host "Supabase project directory not found. Please check the path: backend\supabase-project" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path -Path ".\backend\data")) {
    Write-Host "Creating backend\data directory for database backups..." -ForegroundColor Cyan
    New-Item -Path ".\backend\data" -ItemType Directory -Force | Out-Null
}

$global:ipAddress = Get-IPAddress
if ($global:ipAddress) {
    Write-Host "IP address: $global:ipAddress" -ForegroundColor Green
    [System.Environment]::SetEnvironmentVariable("REACT_NATIVE_PACKAGER_HOSTNAME", $global:ipAddress, "User")
    Write-Host "Environment variable set: REACT_NATIVE_PACKAGER_HOSTNAME=$global:ipAddress" -ForegroundColor Green
} else {
    Write-Host "Could not detect IP address" -ForegroundColor Red
    exit 1
}

Write-Host ""
$startBackend = Read-Host "Do you want to start the Supabase backend? (y/n)"
if ($startBackend -eq "y" -or $startBackend -eq "Y") {
    Start-Supabase
} else {
    Write-Host "Skipping Supabase backend." -ForegroundColor Yellow
}

Write-Host ""
$startFrontend = Read-Host "Do you want to start the Expo frontend? (y/n)"
if ($startFrontend -eq "y" -or $startFrontend -eq "Y") {
    Start-Frontend
} else {
    Write-Host "Skipping Expo frontend." -ForegroundColor Yellow
}

Write-Host "Setup complete! Both Supabase and Expo frontend are running." -ForegroundColor Green
Write-Host "- Expo is available at http://$global:ipAddress`:8081" -ForegroundColor Cyan
Write-Host "- Supabase Studio is available at http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "- Frontend: docker compose logs -f -f expo-app" -ForegroundColor Cyan
Write-Host "- Supabase: cd backend\supabase-project && docker compose logs -f" -ForegroundColor Cyan

while ($true) {
    Write-Host ""
    Write-Host "Do you want to quit or continue" -ForegroundColor Cyan
    Write-Host "- q - quit," -ForegroundColor Cyan
    Write-Host "- r - restart," -ForegroundColor Cyan
    Write-Host "- rf - restart frontend," -ForegroundColor Cyan
    Write-Host "- rb - restart backend," -ForegroundColor Cyan
    $option = Read-Host "or press any key to continue"
    
    if ($option -eq "q") {
        $createBackup = Read-Host "Would you like to create a database backup before shutting down? (y/n)"
        if ($createBackup -eq "y" -or $createBackup -eq "Y") {
            Backup-Database
        }
        
        Write-Host "Shutting down both frontend and backend..." -ForegroundColor Cyan
        Push-Location ".\frontend"
        docker compose down
        Pop-Location
        
        Push-Location ".\backend\supabase-project"
        docker compose down
        Pop-Location
        
        Write-Host "Shutdown complete. Exiting..." -ForegroundColor Green
        break
    } elseif ($option -eq "rb") {
        Restart-Backend
    } elseif ($option -eq "rf") {
        Restart-Frontend
    } elseif ($option -eq "r") {
        Write-Host "Restarting both frontend and backend..." -ForegroundColor Cyan
        Restart-Frontend
        Restart-Backend
    } else {
        Write-Host "Continuing development..." -ForegroundColor Cyan
    }
}