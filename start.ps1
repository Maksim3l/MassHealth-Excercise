function Get-IPAddress {
    $ipv4_address = $null
    $ipconfig_output = ipconfig /all
    
    $wifi_section = $ipconfig_output | Select-String -Pattern "Wireless LAN adapter WiFi:" -Context 0,20 -SimpleMatch
    if ($wifi_section) {
        $ipv4_line = $wifi_section.Context.PostContext | Select-String -Pattern "IPv4 Address"
        if ($ipv4_line) {
            $ipv4_address = ($ipv4_line -split ":")[-1].Trim()
            $ipv4_address = $ipv4_address -replace "\(Preferred\)", ""
            $ipv4_address = $ipv4_address.Trim()
        }
    }
    
    if (-not $ipv4_address) {
        $wireless_sections = $ipconfig_output | Select-String -Pattern "Wireless LAN adapter" -Context 0,20
        foreach ($section in $wireless_sections) {
            if ($section -match "VPN") { continue }
            
            $ipv4_line = $section.Context.PostContext | Select-String -Pattern "IPv4 Address"
            if ($ipv4_line) {
                $ipv4_address = ($ipv4_line -split ":")[-1].Trim()
                $ipv4_address = $ipv4_address -replace "\(Preferred\)", ""
                $ipv4_address = $ipv4_address.Trim()
                break 
            }
        }
    }

    if (-not $ipv4_address) {
        $ethernet_sections = $ipconfig_output | Select-String -Pattern "Ethernet adapter" -Context 0,20
        foreach ($section in $ethernet_sections) {
            if ($section -match "VPN|Virtual|Radmin") { continue }
            
            $ipv4_line = $section.Context.PostContext | Select-String -Pattern "IPv4 Address"
            if ($ipv4_line) {
                $ipv4_address = ($ipv4_line -split ":")[-1].Trim()
                $ipv4_address = $ipv4_address -replace "\(Preferred\)", ""
                $ipv4_address = $ipv4_address.Trim()
                break  
            }
        }
    }
    
    if (-not $ipv4_address) {
        $all_sections = $ipconfig_output | Select-String -Pattern "adapter" -Context 0,20
        foreach ($section in $all_sections) {
            if ($section -match "VPN|Virtual|Radmin") { continue }
            
            $ipv4_line = $section.Context.PostContext | Select-String -Pattern "IPv4 Address"
            if ($ipv4_line) {
                $ipv4_address = ($ipv4_line -split ":")[-1].Trim()
                $ipv4_address = $ipv4_address -replace "\(Preferred\)", ""
                $ipv4_address = $ipv4_address.Trim()
                break 
            }
        }
    }
    
    return $ipv4_address
}

function Get-ServiceIPs {
    Write-Host "`n=== Service IP Configuration ===" -ForegroundColor Yellow
    
    # Supabase IP
    Write-Host "Enter Supabase IP address (press Enter for Default:$global:ipAddress):" -ForegroundColor Cyan
    $supabaseInput = Read-Host "Supabase IP "
    
    if ([string]::IsNullOrWhiteSpace($supabaseInput)) {
        $global:supabaseIP = $global:ipAddress
    } else {
        if ($supabaseInput -match "^(localhost|(\d{1,3}\.){3}\d{1,3}|[\w\.-]+)$") {
            $global:supabaseIP = $supabaseInput
        } else {
            Write-Host "Invalid IP format. Using default: $global:ipAddress" -ForegroundColor Yellow
            $global:supabaseIP = $global:ipAddress
        }
    }
    
    # MQTT IP
    Write-Host "Enter MQTT/Mosquitto IP address (press Enter for Default:$global:ipAddress):" -ForegroundColor Cyan
    $mqttInput = Read-Host "MQTT IP"
    
    if ([string]::IsNullOrWhiteSpace($mqttInput)) {
        $global:mqttIP = $global:ipAddress
    } else {
        if ($mqttInput -match "^(localhost|(\d{1,3}\.){3}\d{1,3}|[\w\.-]+)$") {
            $global:mqttIP = $mqttInput
        } else {
            Write-Host "Invalid IP format. Using default: $global:ipAddress" -ForegroundColor Yellow
            $global:mqttIP = $global:ipAddress
        }
    }
    
    Write-Host "`nConfiguration:" -ForegroundColor Green
    Write-Host "- Supabase IP: $global:supabaseIP" -ForegroundColor White
    Write-Host "- MQTT IP: $global:mqttIP" -ForegroundColor White
}

function Update-SupabaseFile {
    $supabaseFile = Join-Path $PSScriptRoot "frontend\utils\supabase.ts"
    
    if (Test-Path $supabaseFile) {
        $content = Get-Content $supabaseFile -Raw
        Write-Host "Updating Supabase configuration with IP: $global:supabaseIP" -ForegroundColor Yellow

        $pattern = '(process\.env\.EXPO_PUBLIC_SUPABASE_URL\s*\|\|\s*"http:\/\/)([\d\.]+:\d+)"'
        $replacement = "`${1}$global:supabaseIP`:8000`""

        $newContent = $content -replace $pattern, $replacement
        
        if ($newContent -match "http://$global:supabaseIP`:8000") {
            Set-Content -Path $supabaseFile -Value $newContent -Force
            Write-Host "Successfully updated Supabase URL to http://$global:supabaseIP`:8000" -ForegroundColor Green
        } else {
            Write-Host "Warning: Supabase IP replacement may not have worked correctly" -ForegroundColor Yellow
            Write-Host "Please verify the content of $supabaseFile" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Error: Could not find $supabaseFile" -ForegroundColor Red
    }
}

function Update-MQTTFile {
    $mqttFile = Join-Path $PSScriptRoot "frontend\app\GlobalDataProvider.tsx"
    $loginFile = Join-Path $PSScriptRoot "frontend\app\login.tsx"
    
    # Update GlobalDataProvider.tsx
    if (Test-Path $mqttFile) {
        $content = Get-Content $mqttFile -Raw
        Write-Host "Updating MQTT configuration in GlobalDataProvider.tsx with IP: $global:mqttIP" -ForegroundColor Yellow
        
        $pattern = "(const client = new Paho\.Client\(')[^']+(',\s*9001,)"
        $replacement = "`${1}$global:mqttIP`${2}"
        $newContent = $content -replace $pattern, $replacement
        
        if ($newContent -match "new Paho\.Client\('$global:mqttIP', 9001,") {
            Set-Content -Path $mqttFile -Value $newContent -Force
            Write-Host "Successfully updated MQTT client in GlobalDataProvider.tsx to use IP: $global:mqttIP" -ForegroundColor Green
        } else {
            Write-Host "Warning: MQTT IP replacement in GlobalDataProvider.tsx may not have worked correctly" -ForegroundColor Yellow
            Write-Host "Please verify the content of $mqttFile" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Error: Could not find $mqttFile" -ForegroundColor Red
    }
    
    # Update login.tsx
    if (Test-Path $loginFile) {
        $loginContent = Get-Content $loginFile -Raw
        Write-Host "Updating MQTT configuration in login.tsx with IP: $global:mqttIP" -ForegroundColor Yellow
        
        $loginPattern = "(const MQTT_HOST = ')[^']+(';\s*//.*)"
        $loginReplacement = "`${1}$global:mqttIP`${2}"
        $newLoginContent = $loginContent -replace $loginPattern, $loginReplacement
        
        if ($newLoginContent -match "const MQTT_HOST = '$global:mqttIP';") {
            Set-Content -Path $loginFile -Value $newLoginContent -Force
            Write-Host "Successfully updated MQTT_HOST in login.tsx to: $global:mqttIP" -ForegroundColor Green
        } else {
            Write-Host "Warning: MQTT IP replacement in login.tsx may not have worked correctly" -ForegroundColor Yellow
            Write-Host "Please verify the content of $loginFile" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Error: Could not find $loginFile" -ForegroundColor Red
    }
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

function Update-HealthDataFiles {
    param (
        [string]$Platform
    )
    
    $homePath = Join-Path $PSScriptRoot "frontend\app\(authenticated)\(tabs)\home.tsx"
    $activityPath = Join-Path $PSScriptRoot "frontend\app\(authenticated)\(tabs)\activity.tsx"
    
    Write-Host "Updating health data files for platform: $Platform" -ForegroundColor Yellow
    
    if (Test-Path $homePath) {
        Update-HomeFile -FilePath $homePath -Platform $Platform
    } else {
        Write-Host "Warning: Could not find $homePath" -ForegroundColor Yellow
    }
    
    if (Test-Path $activityPath) {
        Update-ActivityFile -FilePath $activityPath -Platform $Platform
    } else {
        Write-Host "Warning: Could not find $activityPath" -ForegroundColor Yellow
    }
}

function Update-HomeFile-Corrected {
    param (
        [string]$FilePath,
        [string]$Platform
    )
    
    $lines = Get-Content $FilePath
    $newLines = @()
    
    foreach ($line in $lines) {
        $newLine = $line
        
        # Extract indentation and determine if line is commented
        if ($line -match '^(\s*)(/+)?\s*(.*)$') {
            $indent = $matches[1]
            $commentSlashes = $matches[2]
            $content = $matches[3]
            $isCommented = ![string]::IsNullOrEmpty($commentSlashes)
        }
        
        switch ($Platform) {
            "ios" {
                # Handle imports - matches any number of comment slashes
                if ($content -match "import useHealthDataios") {
                    $newLine = "import useHealthDataios from '../../../hooks/useHealthDataios'"
                }
                elseif ($content -match "import useHealthData(?!ios)") {
                    $newLine = "//import useHealthData from '../../../hooks/useHealthData'"
                }
                # Handle hook declarations
                elseif ($content -match "const iosHealthData") {
                    $newLine = "$indent const iosHealthData = useHealthDataios(selectedDate)"
                }
                elseif ($content -match "const androidHealthData") {
                    $newLine = "$indent //const androidHealthData = useHealthData(selectedDate);"
                }
                # Handle variable declaration
                elseif ($content -match "let sleep = .+, calories = .+;") {
                    $newLine = "$indent let sleep = 0, calories = 0;"
                }
                # Handle iOS assignments (uncomment and set)
                elseif ($content -match "sleep = iosHealthData") {
                    $newLine = "$indent sleep = iosHealthData?.sleepingHours || 0;"
                }
                elseif ($content -match "calories = iosHealthData") {
                    $newLine = "$indent calories = iosHealthData?.calories || 0;"
                }
                # Comment out Android assignments - THIS IS THE KEY FIX
                elseif ($line -match "^(\s*)(?!/+)(sleep = androidHealthData\.sleep;?)") {
                    $newLine = "$($matches[1])//sleep = androidHealthData.sleep;"
                }
                elseif ($line -match "^(\s*)(?!/+)(calories = androidHealthData\.energy;?)") {
                    $newLine = "$($matches[1])//calories = androidHealthData.energy;"
                }
            }
            "android" {
                # Handle imports
                if ($content -match "import useHealthData(?!ios)") {
                    $newLine = "import useHealthData from '../../../hooks/useHealthData'"
                }
                elseif ($content -match "import useHealthDataios") {
                    $newLine = "//import useHealthDataios from '../../../hooks/useHealthDataios'"
                }
                # Handle hook declarations
                elseif ($content -match "const androidHealthData") {
                    $newLine = "$indent const androidHealthData = useHealthData(selectedDate);"
                }
                elseif ($content -match "const iosHealthData") {
                    $newLine = "$indent //const iosHealthData = useHealthDataios(selectedDate)"
                }
                # Handle variable declaration
                elseif ($content -match "let sleep = .+, calories = .+;") {
                    $newLine = "$indent let sleep = 0, calories = 0;"
                }
                # Handle Android assignments (uncomment and set)
                elseif ($content -match "sleep = androidHealthData") {
                    $newLine = "$indent sleep = androidHealthData?.sleep || 0;"
                }
                elseif ($content -match "calories = androidHealthData") {
                    $newLine = "$indent calories = androidHealthData?.energy || 0;"
                }
                # Comment out iOS assignments
                elseif ($line -match "^(\s*)(?!/+)(sleep = iosHealthData\.sleepingHours;?)") {
                    $newLine = "$($matches[1])//sleep = iosHealthData.sleepingHours;"
                }
                elseif ($line -match "^(\s*)(?!/+)(calories = iosHealthData\.calories;?)") {
                    $newLine = "$($matches[1])//calories = iosHealthData.calories;"
                }
            }
            "expo" {
                # Comment all imports
                if ($content -match "import useHealthDataios" -and !$isCommented) {
                    $newLine = "//import useHealthDataios from '../../../hooks/useHealthDataios'"
                }
                elseif ($content -match "import useHealthData" -and !$isCommented) {
                    $newLine = "//import useHealthData from '../../../hooks/useHealthData'"
                }
                # Comment hook usage
                elseif ($content -match "const androidHealthData" -and !$isCommented) {
                    $newLine = "$indent //const androidHealthData = useHealthData(selectedDate);"
                }
                elseif ($content -match "const iosHealthData" -and !$isCommented) {
                    $newLine = "$indent //const iosHealthData = useHealthDataios(selectedDate)"
                }
                # Set mock values in variable declaration
                elseif ($content -match "let sleep = .+, calories = .+;") {
                    $newLine = "$indent let sleep = 8.3, calories = 714;"
                }
                # Comment all platform-specific assignments
                elseif ($line -match "^(\s*)(?!/+)(sleep = (?:androidHealthData\.sleep|iosHealthData\.sleepingHours);?)") {
                    $newLine = "$($matches[1])//$($matches[2]) [commented for Expo]"
                }
                elseif ($line -match "^(\s*)(?!/+)(calories = (?:androidHealthData\.energy|iosHealthData\.calories);?)") {
                    $newLine = "$($matches[1])//$($matches[2]) [commented for Expo]"
                }
            }
        }
        
        $newLines += $newLine
    }
    
    $newLines | Set-Content -Path $FilePath -Force
    Write-Host "Successfully updated home.tsx with corrected patterns for $Platform" -ForegroundColor Green
}



function Update-ActivityFile {
    param (
        [string]$FilePath,
        [string]$Platform
    )
    
    $lines = Get-Content $FilePath
    $newLines = @()
    
    foreach ($line in $lines) {
        $newLine = $line
        $indent = if ($line -match '^(\s*)') { $matches[1] } else { '' }
        
        switch ($Platform) {
            "ios" {
                # Handle imports - matches any number of comment slashes
                if ($line -match "^(\s*)/+\s*import useHealthDataios" -or $line -match "^(\s*)import useHealthDataios") {
                    $newLine = "import useHealthDataios from '../../../hooks/useHealthDataios'"
                }
                elseif ($line -match "^(\s*)/+\s*import useHealthData(?!ios)" -or $line -match "^(\s*)import useHealthData(?!ios)") {
                    $newLine = "//import useHealthData from '../../../hooks/useHealthData'"
                }
                # Handle hook declarations
                elseif ($line -match "^(\s*)/+\s*const iosHealthData" -or $line -match "^(\s*)const iosHealthData") {
                    $newLine = "$indent const iosHealthData = useHealthDataios(date)"
                }
                elseif ($line -match "^(\s*)/+\s*const androidHealthData" -or $line -match "^(\s*)const androidHealthData") {
                    $newLine = "$indent //const androidHealthData = useHealthData(date);"
                }
                # Handle variable declaration - preserve indentation from original
                elseif ($line -match "^(\s*)let steps = .+, flights = .+, distance = .+;") {
                    $newLine = "$($matches[1])let steps = 0, flights = 0, distance = 0;"
                }
                # Handle iOS assignments (uncomment and set) - matches any number of slashes
                elseif ($line -match "^(\s*)/+\s*steps = iosHealthData" -or $line -match "^(\s*)steps = iosHealthData") {
                    $newLine = "$indent steps = iosHealthData?.steps || 0;"
                }
                elseif ($line -match "^(\s*)/+\s*flights = iosHealthData" -or $line -match "^(\s*)flights = iosHealthData") {
                    $newLine = "$indent flights = iosHealthData?.flights || 0;"
                }
                elseif ($line -match "^(\s*)/+\s*distance = iosHealthData" -or $line -match "^(\s*)distance = iosHealthData") {
                    $newLine = "$indent distance = iosHealthData?.distance || 0;"
                }
                # Comment out Android assignments - only if not already commented
                elseif ($line -match "^(\s*)(?!/)(steps = androidHealthData.*)") {
                    $newLine = "$($matches[1])//$($matches[2])"
                }
                elseif ($line -match "^(\s*)(?!/)(flights = androidHealthData.*)") {
                    $newLine = "$($matches[1])//$($matches[2])"
                }
                elseif ($line -match "^(\s*)(?!/)(distance = androidHealthData.*)") {
                    $newLine = "$($matches[1])//$($matches[2])"
                }
            }
            "android" {
                # Handle imports - matches any number of comment slashes
                if ($line -match "^(\s*)/+\s*import useHealthData(?!ios)" -or $line -match "^(\s*)import useHealthData(?!ios)") {
                    $newLine = "import useHealthData from '../../../hooks/useHealthData'"
                }
                elseif ($line -match "^(\s*)/+\s*import useHealthDataios" -or $line -match "^(\s*)import useHealthDataios") {
                    $newLine = "//import useHealthDataios from '../../../hooks/useHealthDataios'"
                }
                # Handle hook declarations
                elseif ($line -match "^(\s*)/+\s*const androidHealthData" -or $line -match "^(\s*)const androidHealthData") {
                    $newLine = "$indent const androidHealthData = useHealthData(date);"
                }
                elseif ($line -match "^(\s*)/+\s*const iosHealthData" -or $line -match "^(\s*)const iosHealthData") {
                    $newLine = "$indent //const iosHealthData = useHealthDataios(date)"
                }
                # Handle variable declaration
                elseif ($line -match "^(\s*)let steps = .+, flights = .+, distance = .+;") {
                    $newLine = "$($matches[1])let steps = 0, flights = 0, distance = 0;"
                }
                # Handle Android assignments (uncomment and set)
                elseif ($line -match "^(\s*)/+\s*steps = androidHealthData" -or $line -match "^(\s*)steps = androidHealthData") {
                    $newLine = "$indent steps = androidHealthData?.steps || 0;"
                }
                elseif ($line -match "^(\s*)/+\s*flights = androidHealthData" -or $line -match "^(\s*)flights = androidHealthData") {
                    $newLine = "$indent flights = androidHealthData?.flights || 0;"
                }
                elseif ($line -match "^(\s*)/+\s*distance = androidHealthData" -or $line -match "^(\s*)distance = androidHealthData") {
                    $newLine = "$indent distance = androidHealthData?.distance || 0;"
                }
                # Comment out iOS assignments - only if not already commented
                elseif ($line -match "^(\s*)(?!/)(steps = iosHealthData.*)") {
                    $newLine = "$($matches[1])//$($matches[2])"
                }
                elseif ($line -match "^(\s*)(?!/)(flights = iosHealthData.*)") {
                    $newLine = "$($matches[1])//$($matches[2])"
                }
                elseif ($line -match "^(\s*)(?!/)(distance = iosHealthData.*)") {
                    $newLine = "$($matches[1])//$($matches[2])"
                }
            }
            "expo" {
                # Comment all imports - preserve existing comments or add new ones
                if ($line -match "^(\s*)(?!/+)import useHealthDataios") {
                    $newLine = "//import useHealthDataios from '../../../hooks/useHealthDataios'"
                }
                elseif ($line -match "^(\s*)(?!/+)import useHealthData") {
                    $newLine = "//import useHealthData from '../../../hooks/useHealthData'"
                }
                # Comment hook usage - preserve existing comments or add new ones
                elseif ($line -match "^(\s*)(?!/+)const androidHealthData") {
                    $newLine = "$($matches[1])//const androidHealthData = useHealthData(date);"
                }
                elseif ($line -match "^(\s*)(?!/+)const iosHealthData") {
                    $newLine = "$($matches[1])//const iosHealthData = useHealthDataios(date)"
                }
                # Set mock values in variable declaration
                elseif ($line -match "^(\s*)let steps = .+, flights = .+, distance = .+;") {
                    $newLine = "$($matches[1])let steps = 18074, flights = 8.4, distance = 1042;"
                }
                # Comment all platform-specific assignments - only if not already commented
                elseif ($line -match "^(\s*)(?!/+)(steps = (?:androidHealthData|iosHealthData).*)") {
                    $newLine = "$($matches[1])//$($matches[2]) [commented for Expo]"
                }
                elseif ($line -match "^(\s*)(?!/+)(flights = (?:androidHealthData|iosHealthData).*)") {
                    $newLine = "$($matches[1])//$($matches[2]) [commented for Expo]"
                }
                elseif ($line -match "^(\s*)(?!/+)(distance = (?:androidHealthData|iosHealthData).*)") {
                    $newLine = "$($matches[1])//$($matches[2]) [commented for Expo]"
                }
            }
        }
        
        $newLines += $newLine
    }
    
    $newLines | Set-Content -Path $FilePath -Force
    Write-Host "Successfully updated activity.tsx with improved precise processing for $Platform" -ForegroundColor Green
}


function Start-Frontend {
    Write-Host "Launching new console for Expo frontend..." -ForegroundColor Cyan

    $frontendPath = Join-Path $PSScriptRoot "frontend"
    
    # Update Supabase configuration
    Update-SupabaseFile
    
    # Update MQTT configuration
    Update-MQTTFile

    # Platform selection
    Write-Host "`nSelect platform to run:" -ForegroundColor Yellow
    Write-Host "1) iOS" -ForegroundColor Cyan
    Write-Host "2) Expo Go" -ForegroundColor Cyan
    Write-Host "3) Android" -ForegroundColor Cyan
    
    $platformChoice = Read-Host "Enter choice (1-3)"
    
    $command = "cd `"$frontendPath`""
    $platformType = ""
    
    switch ($platformChoice) {
        "1" { 
            $command += " ; npx expo start --ios"
            $platformType = "ios"
            Write-Host "Starting Expo for iOS..." -ForegroundColor Green
        }
        "2" { 
            $command += " ; npx expo start"
            $platformType = "expo"
            Write-Host "Starting Expo Go (scan QR code with Expo Go app)..." -ForegroundColor Green
        }
        "3" { 
            $command += " ; npx expo start --android"
            $platformType = "android"
            Write-Host "Starting Expo for Android..." -ForegroundColor Green
            Write-Host "Note: If you need to navigate to a specific screen for Android testing," -ForegroundColor Yellow
            Write-Host "you can manually navigate to: frontend/app/(authenticated)/(tabs)" -ForegroundColor Yellow
        }
        default { 
            $command += " ; npx expo start"
            $platformType = "expo"
            Write-Host "Starting Expo with default settings..." -ForegroundColor Green
        }
    }

    # Update health data files based on selected platform
    Update-HealthDataFiles -Platform $platformType

    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command

    Write-Host "New console launched for Expo frontend" -ForegroundColor Green
    Write-Host "Health data files configured for $platformType platform" -ForegroundColor Green
}

function Start-Extras {
    Write-Host "Starting Extra services..." -ForegroundColor Cyan
    
    # Start Mosquitto
    Write-Host "Starting Mosquitto service..." -ForegroundColor Cyan
    Push-Location ".\mosquitto"
    try {
        docker compose up -d
        Write-Host "Mosquitto service started successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Error starting Mosquitto: $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
    
    Write-Host "Starting Face Authentication service..." -ForegroundColor Cyan
    Push-Location ".\extensions\face_auth"
    try {
        $supabaseURL = "http://$global:supabaseIP`:8000"
        
        # Update .env file
        $envContent = Get-Content .env
        $envContent = $envContent -replace "SUPABASE_URL=.*", "SUPABASE_URL=$supabaseURL"
        $envContent | Set-Content .env
        
        Write-Host "Updated .env with Supabase URL: $supabaseURL" -ForegroundColor Yellow
        docker compose up -d
        Write-Host "Face Authentication service started successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Error starting Face Authentication: $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
    
    Write-Host "Extra services started" -ForegroundColor Green
}

function Restart-Backend {
    Write-Host "Restarting backend..." -ForegroundColor Cyan
    Push-Location ".\backend\supabase-project"
    docker compose down
    docker compose up -d
    Pop-Location
    Write-Host "Backend restarted." -ForegroundColor Green
}

function Restart-Extras {
    Write-Host "Restarting extra services..." -ForegroundColor Cyan
    Push-Location ".\mosquitto"
    docker compose down
    docker compose up -d
    Pop-Location
    Write-Host "Successfully restarted MQTT"
    
    Push-Location ".\extensions\face_auth"
    docker compose down
    $supabaseURL = "http://$global:supabaseIP`:8000"
    $env:SUPABASE_URL = $supabaseURL
    $env:SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q"
    docker compose up -d
    Pop-Location
    Write-Host "Successfully restarted Face Auth"
    Write-Host "Extra services restarted." -ForegroundColor Green
}

function Restart-Frontend {
    Write-Host "Restarting frontend..." -ForegroundColor Cyan
    Start-Frontend
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
    Write-Host "Detected IP address: $global:ipAddress" -ForegroundColor Green
    [System.Environment]::SetEnvironmentVariable("REACT_NATIVE_PACKAGER_HOSTNAME", $global:ipAddress, "User")
    Write-Host "Environment variable set: REACT_NATIVE_PACKAGER_HOSTNAME=$global:ipAddress" -ForegroundColor Green
} else {
    Write-Host "Could not detect IP address" -ForegroundColor Red
    exit 1
}

# Get service IP configurations
Get-ServiceIPs

Write-Host ""
$startBackend = Read-Host "Do you want to start the Supabase backend? (y/n)"
if ($startBackend -eq "y" -or $startBackend -eq "Y") {
    Start-Supabase
} else {
    Write-Host "Skipping Supabase backend." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Extra services available:"
Write-Host " - MQTT docker service"
Write-Host " - Face Auth service"
$startExtras = Read-Host "Do you want to start the extra services? (y/n)"
if ($startExtras -eq "y" -or $startExtras -eq "Y") {
    Start-Extras
} else {
    Write-Host "Skipping Extra services." -ForegroundColor Yellow
}

Write-Host ""
$startFrontend = Read-Host "Do you want to start the Expo frontend? (y/n)"
if ($startFrontend -eq "y" -or $startFrontend -eq "Y") {
    Start-Frontend
} else {
    # Update Supabase configuration
    Update-SupabaseFile
    
    # Update MQTT configuration
    Update-MQTTFile
    Write-Host "Skipping Expo frontend." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "- Expo is available at http://$global:ipAddress`:8081" -ForegroundColor Cyan
Write-Host "- Supabase Studio is available at http://localhost:8000" -ForegroundColor Cyan
Write-Host "- Supabase API configured for: http://$global:supabaseIP`:8000" -ForegroundColor Cyan
Write-Host "- MQTT configured for: $global:mqttIP`:9001" -ForegroundColor Cyan
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
    Write-Host "- re - restart extras," -ForegroundColor Cyan
    $option = Read-Host "or press any key to continue"
    
    if ($option -eq "q") {
        $createBackup = Read-Host "Would you like to create a database backup before shutting down? (y/n)"
        if ($createBackup -eq "y" -or $createBackup -eq "Y") {
            Backup-Database
        }
        
        Write-Host "Shutting down all services..." -ForegroundColor Cyan
        Push-Location ".\frontend"
        docker compose down
        Pop-Location
        
        Push-Location ".\backend\supabase-project"
        docker compose down
        Pop-Location

        Push-Location ".\mosquitto"
        docker compose down
        Pop-Location
        
        Push-Location ".\extensions\face_auth"
        docker compose down
        Pop-Location
        
        Write-Host "Shutdown complete. Exiting..." -ForegroundColor Green
        break
    } elseif ($option -eq "rb") {
        Restart-Backend
    } elseif ($option -eq "rf") {
        Restart-Frontend
    } elseif ($option -eq "re") {
        Restart-Extras
    } elseif ($option -eq "r") {
        Write-Host "Restarting all services..." -ForegroundColor Cyan
        Restart-Frontend
        Restart-Backend
        Restart-Extras
    } else {
        Write-Host "Continuing development..." -ForegroundColor Cyan
    }
}