import requests
from bs4 import BeautifulSoup
import time
import csv
import os
import re
import json
from datetime import datetime

# Constants
BASE_URL = "https://www.muscleandstrength.com"
MUSCLE_GROUPS = [
    "abductors", "abs", "adductors", "biceps", "calves", "chest", "forearms",
    "glutes", "hamstrings", "hip-flexors", "it-band", "lats", "lower-back",
    "middle-back", "neck", "obliques", "palmar-fascia", "plantar-fascia",
    "quads", "shoulders", "traps", "triceps"
]
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_exercise_links(muscle_group):
    """Get all exercise links for a specific muscle group"""
    def fetch_links(url):
        try:
            res = requests.get(url, headers=HEADERS)
            res.raise_for_status()
            soup = BeautifulSoup(res.text, "html.parser")
            cards = soup.select("div.grid-x.grid-margin-x.grid-margin-y div.node-title a")
            return [BASE_URL + a["href"] for a in cards if a.get("href")]
        except requests.exceptions.RequestException as e:
            print(f"  Error fetching {url}: {e}")
            return []
    
    url_with_html = f"{BASE_URL}/exercises/{muscle_group}.html"
    links = fetch_links(url_with_html)
    if not links:
        url_without_html = f"{BASE_URL}/exercises/{muscle_group}"
        print(f"  No links found with .html, trying: {url_without_html}")
        links = fetch_links(url_without_html)
    
    return links

def clean_text(text):
    """Clean and format text by removing extra spaces and normalizing whitespace"""
    if not text:
        return ""
    
    # Replace multiple whitespace with single space
    text = re.sub(r'\s+', ' ', text)
    
    # Remove any HTML tags that might remain
    text = re.sub(r'<[^>]+>', '', text)
    
    return text.strip()

def extract_steps(text):
    """Extract numbered steps from instruction text"""
    if not text:
        return []
    
    # Look for patterns like "1.", "2.", "Step 1:", etc.
    step_patterns = [
        r'\b(\d+)\.\s+([^\d].*?)(?=\b\d+\.\s+|\Z)',      # "1. Do this..."
        r'\bStep\s+(\d+)[\s:]+([^\d].*?)(?=\bStep\s+\d+[\s:]|\Z)',  # "Step 1: Do this..."
    ]
    
    steps = []
    for pattern in step_patterns:
        matches = re.findall(pattern, text, re.DOTALL)
        if matches:
            steps = [(int(num), content.strip()) for num, content in matches]
            # Sort by step number
            steps.sort(key=lambda x: x[0])
            return [content for _, content in steps]
    
    # If no steps found, split by paragraphs as fallback
    if not steps and text.count('\n') > 1:
        return [p.strip() for p in text.split('\n') if p.strip()]
    
    return [text]  # Return original text if no clear steps

def parse_exercise_page(url):
    """Parse an individual exercise page to extract all information"""
    try:
        res = requests.get(url, headers=HEADERS)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
    except requests.exceptions.RequestException as e:
        print(f"    Failed to fetch {url}: {e}")
        return None
    
    def get_text(selector):
        tag = soup.select_one(selector)
        return clean_text(tag.get_text()) if tag else ""
    
    def get_list_item_value(label_text):
        """Extract value from list items with a specific row-label"""
        # Use string parameter instead of text for compatibility
        label_span = soup.find("span", class_="row-label", string=lambda s: s and label_text in s)
        if not label_span:
            return ""
        
        # Get the parent li element
        li_element = label_span.find_parent("li")
        if not li_element:
            return ""
        
        # Try to find field-item inside
        field_item = li_element.select_one(".field-item")
        if field_item:
            return clean_text(field_item.get_text())
        
        # If no field-item, get all text and remove the label
        text = clean_text(li_element.get_text())
        # Remove the label text from the value
        text = text.replace(label_text, "", 1).strip()
        return text
    
    def get_all_images():
        """Extract all exercise images from the page"""
        img_containers = soup.select(".field-name-field-exercise-images img")
        if not img_containers:
            # Alternative image selectors if the primary one doesn't find images
            img_containers = soup.select(".exercise-info img") or soup.select(".exercise-content img")
        
        return [img.get('src', '') for img in img_containers if img.get('src')]
    
    def get_video_url():
        """Extract video URL from iframe if present"""
        iframe = soup.select_one("div.video iframe") or soup.select_one(".field-name-field-exercise-video iframe")
        if iframe and "src" in iframe.attrs:
            return iframe["src"]
        
        # Try to find video directly
        video = soup.select_one("video source")
        if video and "src" in video.attrs:
            return video["src"]
            
        return ""
    
    # Extract instructions and split into steps
    raw_instructions = get_text("div.field-name-body")
    instruction_steps = extract_steps(raw_instructions)
    
    # Extract tips and clean up
    raw_tips = get_text("div.field-name-field-exercise-tips")
    tips_list = [tip.strip() for tip in raw_tips.split("\n") if tip.strip()]
    
    # Get image URLs
    image_urls = get_all_images()
    
    # Compile all data using the new function to extract list item values
    raw_name = get_text("h1")
    cleaned_name = raw_name.removesuffix(" Video Exercise Guide")

    exercise_data = {
        "name": cleaned_name,
        "primary_muscle": get_list_item_value("Target Muscle Group"),
        "secondary_muscles": get_list_item_value("Secondary Muscles"),
        "equipment": get_list_item_value("Equipment Required"),
        "experience_level": get_list_item_value("Experience Level"),
        "mechanics_type": get_list_item_value("Mechanics"),
        "force_type": get_list_item_value("Force Type"),
        "exercise_type": get_list_item_value("Exercise Type"),
        "overview": get_text("div.field-name-field-exercise-overview"),
        "instructions_raw": raw_instructions,  # Store raw instructions
        "tips_raw": raw_tips,  # Store raw tips
        "video_url": get_video_url(),
        "source_url": url
    }
    
    # Store instruction steps and tips in separate fields for proper CSV export
    for i, step in enumerate(instruction_steps):
        exercise_data[f"instruction_step_{i+1}"] = step
    
    for i, tip in enumerate(tips_list):
        exercise_data[f"tip_{i+1}"] = tip
    
    # Store image URLs in separate fields
    for i, img_url in enumerate(image_urls):
        exercise_data[f"image_url_{i+1}"] = img_url
    
    # Add counts for reference
    exercise_data["instruction_step_count"] = len(instruction_steps)
    exercise_data["tip_count"] = len(tips_list)
    exercise_data["image_count"] = len(image_urls)
    
    return exercise_data

def scrape_all(delay=1, resume_from=None):
    """Scrape all exercises with option to resume from a specific muscle group"""
    all_exercises = []
    start_index = 0
    
    # If resuming, find the index to start from
    if resume_from and resume_from in MUSCLE_GROUPS:
        start_index = MUSCLE_GROUPS.index(resume_from)
        print(f"Resuming from muscle group: {resume_from}")
    
    # Create output directory for progress saving
    os.makedirs("muscle_strength_data", exist_ok=True)
    
    # Loop through each muscle group
    for i in range(start_index, len(MUSCLE_GROUPS)):
        muscle = MUSCLE_GROUPS[i]
        print(f"Scraping muscle group: {muscle} ({i+1}/{len(MUSCLE_GROUPS)})")
        
        links = get_exercise_links(muscle)
        print(f"  Found {len(links)} exercises")
        
        # Save the links for this muscle group
        with open(f"muscle_strength_data/{muscle}_links.txt", "w", encoding="utf-8") as f:
            for link in links:
                f.write(f"{link}\n")
        
        muscle_exercises = []
        for j, link in enumerate(links):
            print(f"    Scraping: {j+1}/{len(links)} - {link}")
            try:
                data = parse_exercise_page(link)
                if data:
                    data["muscle_group_category"] = muscle  # Add the muscle group category
                    all_exercises.append(data)
                    muscle_exercises.append(data)
                    
                    # Save progress after every 10 exercises
                    if (j + 1) % 10 == 0 or j == len(links) - 1:
                        save_to_csv(all_exercises, f"muscle_strength_data/all_exercises.csv")
                        print(f"      Progress saved: {len(all_exercises)} exercises total")
                        
                        # Also save as JSON for backup
                        with open(f"muscle_strength_data/all_exercises.json", 'w', encoding='utf-8') as f:
                            json.dump(all_exercises, f, indent=2, ensure_ascii=False)
                
                time.sleep(delay)  # Be respectful to the server
                
            except Exception as e:
                print(f"    Failed: {e}")
        
        # Save exercises for this muscle group
        if muscle_exercises:
            save_to_csv(muscle_exercises, f"muscle_strength_data/{muscle}_exercises.csv")
            
            # Also save as JSON for backup
            with open(f"muscle_strength_data/{muscle}_exercises.json", 'w', encoding='utf-8') as f:
                json.dump(muscle_exercises, f, indent=2, ensure_ascii=False)
        
        print(f"  Completed muscle group: {muscle} - {len(muscle_exercises)} exercises")
    
    return all_exercises

def save_to_csv(data, filename="muscle_and_strength_exercises.csv"):
    """Save data to CSV with proper encoding and handling of special characters"""
    if not data:
        print("No data to save!")
        return
    
    # Ensure all dictionaries have the same keys
    all_keys = set()
    for entry in data:
        all_keys.update(entry.keys())
    
    fieldnames = sorted(list(all_keys))
    
    # Move important fields to the beginning
    priority_fields = [
        "name", "primary_muscle", "secondary_muscles", "muscle_group_category", 
        "equipment", "experience_level", "mechanics_type", "force_type", "exercise_type",
        "overview", "instruction_step_count", "tip_count", "image_count",
        "source_url", "video_url"
    ]
    
    # Sort fields to prioritize the important ones and group related ones together
    for field in reversed(priority_fields):
        if field in fieldnames:
            fieldnames.remove(field)
            fieldnames.insert(0, field)
    
    # Group instruction steps together - exclude count field
    instruction_fields = [f for f in fieldnames if f.startswith("instruction_step_") and not f.endswith("_count")]
    instruction_fields.sort(key=lambda x: int(x.split("_")[-1]))
    
    # Group tips together - exclude count field
    tip_fields = [f for f in fieldnames if f.startswith("tip_") and not f.endswith("_count")]
    tip_fields.sort(key=lambda x: int(x.split("_")[-1]))
    
    # Group image URLs together - exclude count field
    image_fields = [f for f in fieldnames if f.startswith("image_url_") and not f.endswith("_count")]
    image_fields.sort(key=lambda x: int(x.split("_")[-1]))
    
    # Remove instruction step, tip, and image fields to reinsert them in order
    for field in instruction_fields + tip_fields + image_fields:
        if field in fieldnames:
            fieldnames.remove(field)
    
    # Add raw data fields at the end
    raw_fields = ["instructions_raw", "tips_raw"]
    for field in raw_fields:
        if field in fieldnames:
            fieldnames.remove(field)
    
    # Reorganize the field order
    ordered_fieldnames = priority_fields + instruction_fields + tip_fields + image_fields + fieldnames + raw_fields
    # Remove any fields that don't exist in the data
    ordered_fieldnames = [f for f in ordered_fieldnames if f in all_keys]
    
    try:
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=ordered_fieldnames)
            writer.writeheader()
            for entry in data:
                # Ensure all keys exist
                row = {k: entry.get(k, "") for k in ordered_fieldnames}
                writer.writerow(row)
        print(f"Successfully saved {len(data)} exercises to {filename}")
    except Exception as e:
        print(f"Error saving to CSV: {e}")

def main():
    """Main function to run the scraper"""
    start_time = datetime.now()
    print(f"Starting scraper at {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Create the output directory
    os.makedirs("muscle_strength_data", exist_ok=True)
    
    # Option to resume from a specific muscle group
    resume_from = None
    # Uncomment the next line if you want to resume from a specific muscle group
    # resume_from = "hamstrings"  
    
    results = scrape_all(delay=1.5, resume_from=resume_from)
    
    # Save the final results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_to_csv(results, f"muscle_strength_exercises_{timestamp}.csv")
    
    # Also save the raw JSON data as backup
    with open(f"muscle_strength_data/muscle_strength_exercises_{timestamp}.json", 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    end_time = datetime.now()
    duration = end_time - start_time
    print(f"Done! Scraped {len(results)} exercises in {duration}")
    print(f"Results saved to muscle_strength_exercises_{timestamp}.csv")
    print(f"JSON backup saved to muscle_strength_data/muscle_strength_exercises_{timestamp}.json")

if __name__ == "__main__":
    main()