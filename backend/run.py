#!/usr/bin/env python
import subprocess
import sys
import os

def main():
    """Install required dependencies and run the data inputter script."""
    print("===== Installing Required Dependencies =====")
    
    # First, try to fix the pytest issue by forcing it to be uninstalled
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "-y", "pytest"])
        print("Removed pytest to avoid conflicts")
    except:
        # If it fails, that's okay - it might not be installed
        pass
    
    # Try to install packages one by one
    required_packages = ["python-dotenv", "psycopg2"]
    
    for package in required_packages:
        print(f"Installing {package}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-deps", package])
            print(f"Successfully installed {package}")
        except subprocess.CalledProcessError:
            print(f"Failed to install {package}. Continuing anyway...")
    
    # Install supabase separately with --no-deps to avoid dependency issues
    print("Installing supabase...")
    try:
        # Try a different approach to install supabase
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-deps", "supabase"])
        # Install the necessary dependencies manually
        deps = ["httpx", "gotrue", "postgrest", "realtime", "storage3", "supafunc"]
        for dep in deps:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-deps", dep])
        print("Successfully installed supabase")
    except subprocess.CalledProcessError:
        print("Failed to install supabase. Please follow these steps to install it manually:")
        print("1. Open a new command prompt/terminal")
        print("2. Run: pip install supabase")
        print("3. After installation, run: python data_inputter.py")
        sys.exit(1)
    
    print("\nDependencies installed. Now running the data inputter script...")
    
    # Run the data inputter script
    try:
        # Use the full path to the script to avoid any path issues
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data_inputter.py")
        subprocess.check_call([sys.executable, script_path])
    except subprocess.CalledProcessError:
        print("Error running data_inputter.py")
        sys.exit(1)
    except FileNotFoundError:
        print("Error: data_inputter.py not found in the current directory.")
        sys.exit(1)
    
    print("Process completed.")

if __name__ == "__main__":
    main()