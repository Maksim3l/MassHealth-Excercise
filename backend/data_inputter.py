#!/usr/bin/env python
import os
import sys
import subprocess
import json
import platform

def check_dependencies():
    """Check if required dependencies are available and install if needed."""
    required_packages = ["supabase", "python-dotenv", "psycopg2"]
    
    # Check for pip
    try:
        import pip
    except ImportError:
        print("Error: pip is not installed.")
        sys.exit(1)
    
    # Check and install packages
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package} is installed")
        except ImportError:
            print(f"Installing {package}...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            except subprocess.CalledProcessError:
                print(f"Failed to install {package}. Please install it manually.")
                sys.exit(1)

def main():
    """Main function to run the exercise data inputter."""
    import psycopg2
    from supabase import create_client, Client
    
    # Prompt for credentials instead of using .env file
    print("\n===== Supabase Connection Setup =====")
    SUPABASE_URL = input("Enter your Supabase URL (default: http://localhost:8000): ") or "http://localhost:8000"
    SUPABASE_KEY = input("Enter your Supabase service role key: ")
    
    if not SUPABASE_KEY:
        print("Error: Supabase service role key is required")
        sys.exit(1)
    
    print(f"\nConnecting to Supabase at {SUPABASE_URL}...")
    
    # Connect to Supabase
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Successfully connected to Supabase")
    except Exception as e:
        print(f"Error connecting to Supabase: {str(e)}")
        sys.exit(1)
    
    # Get the correct file path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'scraper-scripts', 'merged_exercises.json')
    
    # If file not found in the expected location, ask for the path
    if not os.path.exists(json_path):
        print(f"Could not find exercises file at {json_path}")
        json_path = input("Enter the full path to your merged_exercises.json file: ")
        if not os.path.exists(json_path):
            print(f"Error: File not found at {json_path}")
            sys.exit(1)
    
    try:
        # Load the merged_exercises.json file
        with open(json_path, "r", encoding="utf-8") as file:
            exercises = json.load(file)
            print(f"Loaded {len(exercises)} exercises from JSON file")
    except FileNotFoundError:
        print(f"Error: Could not find file at {json_path}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: The file at {json_path} is not valid JSON")
        sys.exit(1)
    except UnicodeDecodeError:
        # Try with a different encoding if UTF-8 fails
        try:
            with open(json_path, "r", encoding="latin-1") as file:
                exercises = json.load(file)
                print(f"Loaded {len(exercises)} exercises from JSON file (using latin-1 encoding)")
        except:
            print(f"Error: Could not decode the file at {json_path}")
            sys.exit(1)
    
    # Helper function to insert unique values into a table and return the ID
    def get_or_create(table_name, column_name, value):
        if value is None or value == "":
            return None
        
        try:
            response = supabase.table(table_name).select("id").eq(column_name, value).execute()
            if response.data:
                return response.data[0]["id"]
            else:
                insert_response = supabase.table(table_name).insert({column_name: value}).execute()
                if insert_response.data:
                    return insert_response.data[0]["id"]
                else:
                    print(f"Warning: Failed to insert {value} into {table_name}")
                    return None
        except Exception as e:
            print(f"Error in get_or_create for {table_name}.{column_name}={value}: {str(e)}")
            return None
    
    # Push each exercise to Supabase
    inserted_count = 0
    total_exercises = len(exercises)
    
    print(f"\nStarting to insert {total_exercises} exercises into the database...")
    
    for i, exercise in enumerate(exercises):
        try:
            # Get the exercise name for logging
            exercise_name = exercise.get("name", f"Exercise #{i+1}")
            
            # Insert or get IDs for related tables
            primary_muscles = exercise.get("primary_muscles", [])
            if isinstance(primary_muscles, str):
                primary_muscles = [primary_muscles]  # Convert string to list if needed
                
            secondary_muscles = exercise.get("secondary_muscles", [])
            if isinstance(secondary_muscles, str):
                secondary_muscles = [secondary_muscles]  # Convert string to list if needed
            
            primary_muscle_ids = [
                get_or_create("muscles", "name", muscle) for muscle in primary_muscles if muscle
            ]
            primary_muscle_ids = [id for id in primary_muscle_ids if id is not None]
            
            secondary_muscle_ids = [
                get_or_create("muscles", "name", muscle) for muscle in secondary_muscles if muscle
            ]
            secondary_muscle_ids = [id for id in secondary_muscle_ids if id is not None]
            
            equipment_id = get_or_create("equipment", "name", exercise.get("equipment"))
            experience_level_id = get_or_create("experience_levels", "name", exercise.get("experience_level"))
            mechanics_type_id = get_or_create("mechanics_types", "name", exercise.get("mechanics_type"))
            force_type_id = get_or_create("force_types", "name", exercise.get("force_type"))
            exercise_type_id = get_or_create("exercise_types", "name", exercise.get("exercise_type"))
            
            # Insert the exercise into the exercises table
            exercise_data = {
                "name": exercise_name,
                "primary_muscle": exercise.get("primary_muscle"),
                "equipment": equipment_id,
                "experience_level": experience_level_id,
                "mechanics_type": mechanics_type_id,
                "force_type": force_type_id,
                "exercise_type": exercise_type_id,
                "overview": exercise.get("overview"),
                "instructions": exercise.get("instructions"),
                "tips": exercise.get("tips"),
                "video_urls": exercise.get("video_urls"),
                "images": exercise.get("images"),
                "source_url": exercise.get("source_url"),
            }
            
            # Clean up None values that might cause database issues
            exercise_data = {k: v for k, v in exercise_data.items() if v is not None}
            
            # Ensure name is present
            if "name" not in exercise_data or not exercise_data["name"]:
                print(f"Skipping exercise #{i+1} - missing name")
                continue
            
            response = supabase.table("exercises").insert(exercise_data).execute()
            
            if not response.data:
                print(f"Warning: No data returned when inserting {exercise_name}")
                continue
                
            exercise_id = response.data[0]["id"]
            
            # Insert into the exercise_muscles table
            for muscle_id in primary_muscle_ids:
                try:
                    supabase.table("exercise_muscles").insert({
                        "exercise_id": exercise_id,
                        "muscle_id": muscle_id,
                        "is_primary": True
                    }).execute()
                except Exception as e:
                    print(f"Error inserting primary muscle relationship: {str(e)}")
            
            for muscle_id in secondary_muscle_ids:
                try:
                    supabase.table("exercise_muscles").insert({
                        "exercise_id": exercise_id,
                        "muscle_id": muscle_id,
                        "is_primary": False
                    }).execute()
                except Exception as e:
                    print(f"Error inserting secondary muscle relationship: {str(e)}")
            
            inserted_count += 1
            
            # Show progress
            if (i+1) % 10 == 0 or (i+1) == total_exercises:
                progress = (i+1) / total_exercises * 100
                print(f"Progress: {i+1}/{total_exercises} exercises inserted ({progress:.1f}%)")
                
        except Exception as e:
            exercise_name = exercise.get("name", f"Exercise #{i+1}")
            print(f"Error inserting exercise {exercise_name}: {str(e)}")
    
    print(f"\nFinished! Successfully inserted {inserted_count} out of {total_exercises} exercises.")

if __name__ == "__main__":
    print("===== Exercise Data Import Tool =====")
    print("Checking dependencies...")
    check_dependencies()
    print("\nStarting data import process...")
    main()
    print("\nProcess completed.")