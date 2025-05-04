# Za https://musclewiki.com/directory
import requests
import json
import re
import time
import csv
from bs4 import BeautifulSoup
from urllib.parse import urljoin


class MuscleWikiScraper:
    def __init__(self):
        self.base_url = "https://musclewiki.com/"
        self.api_url = "https://musclewiki.com/newapi/exercise/exercises/directory/"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # All muscle IDs as provided in the example URL
        self.all_muscles = "21,10,4,43,50,29,19,8,44,30,41,12,33,38,36,18,28,15,48,24,49,16,22,25,39,20,46,2,42,5,40,26,11,17,14,31,9,7,34,3,23,47,13,37,32,6,35,27"
        self.results = []

    def get_exercises_from_api(self):
        """Fetch exercise data from the MuscleWiki API"""
        params = {
            "muscles": self.all_muscles
        }
        
        try:
            response = requests.get(self.api_url, params=params, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching API data: {e}")
            return []

    def extract_step_instructions(self, soup):
        """Extract numbered step instructions from the page"""
        instructions = []
        steps_container = soup.select_one("dl.my-5.grid")
        
        if steps_container:
            steps = steps_container.find_all("div", class_="flex")
            for step in steps:
                step_text = step.find("dd").get_text(strip=True)
                if step_text:
                    instructions.append(step_text)
        
        return instructions

    def extract_detailed_instructions(self, soup):
        """Extract detailed instructions and tips from the bottom section"""
        detailed_info = {"instructions": [], "tips": []}
        
        # Find the detailed instructions container
        detailed_div = soup.select_one("div.mb-8.rounded-lg.border.bg-white")
        
        if detailed_div:
            paragraphs = detailed_div.find_all("p", class_="text-left")
            
            # Process the paragraphs
            in_tips_section = False
            in_instructions_section = False
            
            for p in paragraphs:
                text = p.get_text(strip=True)
                
                if not text:
                    continue
                
                # Check if we're entering the tips section
                if "Ty's Tips" in text:
                    in_tips_section = True
                    in_instructions_section = False
                    continue
                
                # Check if we're entering the detailed how-to section
                if "Detailed How To:" in text:
                    in_instructions_section = True
                    in_tips_section = False
                    continue
                
                # Skip lines with just formatting
                if text == "**" or text == "**":
                    continue
                
                # Add the text to the appropriate section
                if in_tips_section and text:
                    detailed_info["tips"].append(text)
                elif in_instructions_section and text:
                    if text.startswith("-"):
                        detailed_info["instructions"].append(text[1:].strip())
                    else:
                        detailed_info["instructions"].append(text)
        
        return detailed_info

    def extract_video_url(self, soup):
        """Extract the video URL from the page"""
        video_element = soup.select_one("video.rounded-lg source")
        if video_element and video_element.has_attr("src"):
            return video_element["src"]
        return None

    def scrape_exercise_page(self, target_url):
        """Scrape detailed information from individual exercise page"""
        # Choose the male version
        male_url = target_url.get("male", "")
        if not male_url:
            return None
        
        full_url = urljoin(self.base_url, male_url)
        
        try:
            response = requests.get(full_url, headers=self.headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract step-by-step instructions
            step_instructions = self.extract_step_instructions(soup)
            
            # Extract detailed instructions and tips
            detailed_info = self.extract_detailed_instructions(soup)
            
            # Extract video URL
            video_url = self.extract_video_url(soup)
            
            return {
                "overview": step_instructions,
                "instructions": detailed_info["instructions"],
                "tips": detailed_info["tips"],
                "video_url": video_url,
                "source_url": full_url
            }
        except requests.exceptions.RequestException as e:
            print(f"Error scraping exercise page {full_url}: {e}")
            return None

    def process_exercise(self, exercise):
        """Process a single exercise entry"""
        # Basic info from API
        exercise_data = {
            "name": exercise.get("name", ""),
            "primary_muscle": ", ".join([muscle["name"] for muscle in exercise.get("muscles", []) if muscle.get("level", 0) == 0]),
            "equipment": exercise.get("category", {}).get("name", ""),
            "experience_level": exercise.get("difficulty", {}).get("name", ""),
            "overview": [],
            "instructions": [],
            "tips": [],
            "video_url": "",
            "source_url": ""
        }
        
        # Get detailed info from exercise page
        detailed_info = self.scrape_exercise_page(exercise.get("target_url", {}))
        if detailed_info:
            exercise_data.update(detailed_info)
        
        return exercise_data

    def run(self, output_file="musclewiki_exercises.json", delay=1):
        """Run the scraper and save results to a file"""
        exercises = self.get_exercises_from_api()
        total = len(exercises)
        
        print(f"Found {total} exercises. Starting to process...")
        
        for i, exercise in enumerate(exercises):
            print(f"Processing exercise {i+1}/{total}: {exercise.get('name', 'Unknown')}")
            result = self.process_exercise(exercise)
            if result:
                self.results.append(result)
            
            # Add delay to avoid overwhelming the server
            if i < total - 1:  # Don't delay after the last item
                time.sleep(delay)
        
        # Save results to JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=4)
        
        # Also save as CSV for convenience
        csv_file = output_file.replace('.json', '.csv')
        self.save_to_csv(csv_file)
        
        print(f"Scraping completed. Saved {len(self.results)} exercises to {output_file} and {csv_file}")

    def save_to_csv(self, csv_file):
        """Save the results to a CSV file"""
        if not self.results:
            return
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            # Get all unique keys
            fieldnames = ["name", "primary_muscle", "equipment", "experience_level", 
                         "overview", "instructions", "tips", "video_url", "source_url"]
            
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for result in self.results:
                # Convert lists to strings for CSV
                result_copy = result.copy()
                if isinstance(result_copy.get("overview"), list):
                    result_copy["overview"] = " | ".join(result_copy["overview"])
                if isinstance(result_copy.get("instructions"), list):
                    result_copy["instructions"] = " | ".join(result_copy["instructions"])
                if isinstance(result_copy.get("tips"), list):
                    result_copy["tips"] = " | ".join(result_copy["tips"])
                writer.writerow(result_copy)


if __name__ == "__main__":
    scraper = MuscleWikiScraper()
    scraper.run(delay=1.5)  # Add a 1.5-second delay between requests to be considerate