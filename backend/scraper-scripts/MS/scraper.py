# Za https://www.muscleandstrength.com/exercises

import requests
from bs4 import BeautifulSoup
import time
import csv

BASE_URL = "https://www.muscleandstrength.com"
MUSCLE_GROUPS = [
    "abductors", "abs", "adductors", "biceps", "calves", "chest", "forearms",
    "glutes", "hamstrings", "hip-flexors", "it-band", "lats", "lower-back",
    "upper-back", "neck", "obliques", "palmar-fascia", "plantar-fascia",
    "quads", "shoulders", "traps", "triceps"
]

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def get_exercise_links(muscle_group):
    url = f"{BASE_URL}/exercises/{muscle_group}.html"
    res = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")
    cards = soup.select("div.grid-x.grid-margin-x.grid-margin-y div.node-title a")
    links = [BASE_URL + a["href"] for a in cards if a.get("href")]
    return links

def parse_exercise_page(url):
    res = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(res.text, "html.parser")

    def get_text(selector):
        tag = soup.select_one(selector)
        return tag.get_text(strip=True) if tag else ""

    def get_next_div_text(label_text):
        label = soup.find('span', text=label_text)
        return label.find_next('div').get_text(strip=True) if label else ""

    def get_secondary_muscles():
        label = soup.find('span', text='Secondary Muscles')
        if label:
            div = label.find_next('div')
            return div.get_text(strip=True) if div else ""
        return ""

    def get_video_url():
        iframe = soup.select_one("div.video iframe")
        return iframe["src"] if iframe and "src" in iframe.attrs else ""

    return {
        "name": get_text("h1"),
        "primary_muscle": get_next_div_text("Target Muscle Group"),
        "secondary_muscles": get_secondary_muscles(),
        "equipment": get_next_div_text("Equipment Required"),
        "experience_level": get_next_div_text("Experience Level"),
        "overview": get_text("div.field-name-field-exercise-overview"),
        "instructions": get_text("div.field-name-body"),
        "tips": get_text("div.field-name-field-exercise-tips"),
        "video_url": get_video_url(),
        "source_url": url
    }

def scrape_all():
    all_exercises = []
    for muscle in MUSCLE_GROUPS:
        print(f"Scraping muscle group: {muscle}")
        links = get_exercise_links(muscle)
        print(f"  Found {len(links)} exercises")
        for link in links:
            print(f"    Scraping: {link}")
            try:
                data = parse_exercise_page(link)
                all_exercises.append(data)
                time.sleep(1)  # Be respectful
            except Exception as e:
                print(f"    Failed: {e}")
    return all_exercises

def save_to_csv(data, filename="muscle_and_strength_exercises.csv"):
    if not data:
        return
    keys = data[0].keys()
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)

if __name__ == "__main__":
    results = scrape_all()
    save_to_csv(results)
    print("Done! Saved to muscle_and_strength_exercises.csv")
