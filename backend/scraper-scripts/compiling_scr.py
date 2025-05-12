import json

# Load JSON files
with open("MW/musclewiki_exercises.json", "r", encoding="utf-8") as f1, \
     open("MS/muscle_strength_data/all_exercises.json", "r", encoding="utf-8") as f2, \
     open("FEG/exercises.json", "r", encoding="utf-8") as f3:
    musclewiki_exercises = json.load(f1)
    all_exercises = json.load(f2)
    exercises = json.load(f3)

# Create a dictionary to store merged exercises by name
merged_exercises = {}
id_counter = 1  # Initialize a counter for numeric IDs

# Helper function to safely extend lists
def safe_extend(target_list, new_items):
    if new_items:
        target_list.extend(item for item in new_items if item not in target_list)

# Add exercises from musclewiki_exercises.json
for exercise in musclewiki_exercises:
    name = exercise.get("name", "unknown").strip()
    if name not in merged_exercises:
        merged_exercises[name] = {
            "id": id_counter,
            "name": name,
            "primary_muscle": exercise.get("primary_muscle"),
            "primary_muscles": [],  # Initialize for consistency
            "secondary_muscles": [],
            "equipment": exercise.get("equipment"),
            "experience_level": exercise.get("experience_level"),
            "mechanics_type": None,
            "force_type": None,
            "exercise_type": None,
            "overview": " ".join(exercise.get("overview", [])),
            "instructions": exercise.get("instructions", []),
            "tips": exercise.get("tips", []),
            "video_urls": exercise.get("video_urls", {}),
            "images": [],
            "source_url": exercise.get("source_url")
        }
        id_counter += 1  # Increment the ID counter

# Add exercises from all_exercises.json
for exercise in all_exercises:
    name = exercise.get("name", "unknown").strip()
    if name in merged_exercises:
        # Merge data if exercise already exists
        safe_extend(merged_exercises[name]["secondary_muscles"], exercise.get("secondary_muscles", "").split(", "))
        merged_exercises[name]["primary_muscle"] = merged_exercises[name]["primary_muscle"] or exercise.get("primary_muscle")
        safe_extend(merged_exercises[name]["primary_muscles"], [exercise.get("primary_muscle")])
        merged_exercises[name]["equipment"] = merged_exercises[name]["equipment"] or exercise.get("equipment")
        merged_exercises[name]["experience_level"] = merged_exercises[name]["experience_level"] or exercise.get("experience_level")
        merged_exercises[name]["mechanics_type"] = merged_exercises[name]["mechanics_type"] or exercise.get("mechanics_type")
        merged_exercises[name]["force_type"] = merged_exercises[name]["force_type"] or exercise.get("force_type")
        merged_exercises[name]["exercise_type"] = merged_exercises[name]["exercise_type"] or exercise.get("exercise_type")
        merged_exercises[name]["overview"] = merged_exercises[name]["overview"] or exercise.get("overview")
        merged_exercises[name]["source_url"] = merged_exercises[name]["source_url"] or exercise.get("source_url")
    else:
        # Add new exercise
        merged_exercises[name] = {
            "id": id_counter,
            "name": name,
            "primary_muscle": exercise.get("primary_muscle"),
            "primary_muscles": [exercise.get("primary_muscle")],
            "secondary_muscles": exercise.get("secondary_muscles", "").split(", "),
            "equipment": exercise.get("equipment"),
            "experience_level": exercise.get("experience_level"),
            "mechanics_type": exercise.get("mechanics_type"),
            "force_type": exercise.get("force_type"),
            "exercise_type": exercise.get("exercise_type"),
            "overview": exercise.get("overview"),
            "instructions": exercise.get("instructions_raw", "").split(". "),
            "tips": exercise.get("tips_raw", "").split(". "),
            "video_urls": {"other": exercise.get("video_url")},
            "images": [],
            "source_url": exercise.get("source_url")
        }
        id_counter += 1  # Increment the ID counter

# Add exercises from exercises.json
for exercise in exercises:
    name = exercise.get("name", exercise.get("id", "unknown").replace("_", " ").strip())
    if name in merged_exercises:
        # Merge data if exercise already exists
        safe_extend(merged_exercises[name]["primary_muscles"], exercise.get("primaryMuscles", []))
        safe_extend(merged_exercises[name]["secondary_muscles"], exercise.get("secondaryMuscles", []))
        merged_exercises[name]["equipment"] = merged_exercises[name]["equipment"] or exercise.get("equipment")
        merged_exercises[name]["experience_level"] = merged_exercises[name]["experience_level"] or exercise.get("level")
        merged_exercises[name]["mechanics_type"] = merged_exercises[name]["mechanics_type"] or exercise.get("mechanic")
        merged_exercises[name]["force_type"] = merged_exercises[name]["force_type"] or exercise.get("force")
        merged_exercises[name]["exercise_type"] = merged_exercises[name]["exercise_type"] or exercise.get("category")
        merged_exercises[name]["instructions"] = merged_exercises[name]["instructions"] or exercise.get("instructions", [])
        safe_extend(merged_exercises[name]["images"], exercise.get("images", []))
    else:
        # Add new exercise
        merged_exercises[name] = {
            "id": id_counter,
            "name": name,
            "primary_muscle": exercise.get("primaryMuscles", [None])[0],
            "primary_muscles": exercise.get("primaryMuscles", []),
            "secondary_muscles": exercise.get("secondaryMuscles", []),
            "equipment": exercise.get("equipment"),
            "experience_level": exercise.get("level"),
            "mechanics_type": exercise.get("mechanic"),
            "force_type": exercise.get("force"),
            "exercise_type": exercise.get("category"),
            "overview": None,
            "instructions": exercise.get("instructions", []),
            "tips": [],
            "video_urls": {},
            "images": exercise.get("images", []),
            "source_url": None
        }
        id_counter += 1  # Increment the ID counter

# Save the merged JSON
with open("merged_exercises.json", "w", encoding="utf-8") as f:
    json.dump(list(merged_exercises.values()), f, indent=4)