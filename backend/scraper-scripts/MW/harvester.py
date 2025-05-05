import requests
import json
import time
import csv
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright


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
        
        steps_container = soup.select_one("dl[class*='my-5'][class*='grid']")

        if not steps_container:
            steps_container = soup.select_one("dl.my-5, dl.grid")
            
        if not steps_container:
            parent_div = soup.select_one("div.sm\\:pb-5 div.flex.flex-col")
            if parent_div:
                steps_container = parent_div.find("dl")

        if steps_container:
            # Look for all divs with the border-gray-200 class that contain the steps
            steps = steps_container.find_all("div", class_="border-gray-200")
            
            for step in steps:
                # Extract text from the dd element which contains the instruction
                dd_element = step.find("dd")
                if dd_element:
                    step_text = dd_element.get_text(strip=True)
                    if step_text:
                        instructions.append(step_text)
        
        return instructions

    def extract_detailed_instructions(self, soup):
        """Extract detailed instructions and tips from the bottom section"""
        detailed_info = {"instructions": [], "tips": []}
        
        # Find the detailed instructions container - more specific selector
        detailed_div = soup.select_one("div.mb-8.rounded-lg.border.bg-white.py-4")

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
                if "Ty's Tips" in text or "**Ty's Tips**" in text:
                    in_tips_section = True
                    in_instructions_section = False
                    continue
                
                # Check if we're entering the detailed how-to section
                if "Detailed How To:" in text or "**Detailed How To:**" in text:
                    in_instructions_section = True
                    in_tips_section = False
                    continue
                
                # Add the text to the appropriate section
                if in_tips_section and text:
                    # Clean up markdown formatting
                    clean_text = text.replace("**", "").strip()
                    if clean_text and clean_text != "Ty's Tips":
                        detailed_info["tips"].append(clean_text)
                        
                elif in_instructions_section and text:
                    # Clean up markdown formatting and bullet points
                    clean_text = text.replace("**", "").strip()
                    if clean_text and clean_text != "Detailed How To:":
                        if clean_text.startswith("-"):
                            detailed_info["instructions"].append(clean_text[1:].strip())
                        else:
                            detailed_info["instructions"].append(clean_text)
        
        return detailed_info

    def extract_video_urls(self, soup):
        """Extract all video URLs from the page"""
        video_urls = []
        
        # Find all video sources
        video_elements = soup.select("video.rounded-lg source")
        
        for video in video_elements:
            if video.has_attr("src"):
                video_urls.append(video["src"])
        
        # Return a dictionary with front and side views if available
        result = {}
        if len(video_urls) >= 1:
            result["front"] = video_urls[0]
        if len(video_urls) >= 2:
            result["side"] = video_urls[1]
            
        return result

    def scrape_exercise_page(self, target_url):
        """Scrape detailed information from individual exercise page using Playwright"""
        male_url = target_url.get("male", "")
        if not male_url:
            return None

        full_url = urljoin(self.base_url, male_url)
        print(f"\tProcessing {full_url}")

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(full_url)
                page.wait_for_load_state("networkidle")
                html = page.content()
                browser.close()

            soup = BeautifulSoup(html, "html.parser")

            step_instructions = self.extract_step_instructions(soup)
            detailed_info = self.extract_detailed_instructions(soup)
            video_urls = self.extract_video_urls(soup)

            return {
                "overview": step_instructions,
                "instructions": detailed_info["instructions"],
                "tips": detailed_info["tips"],
                "video_urls": video_urls,
                "source_url": full_url
            }

        except Exception as e:
            print(f"Error scraping {full_url} with Playwright: {e}")
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
            "video_urls": {},
            "source_url": ""
        }
        
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

            if i < total - 1: 
                time.sleep(delay)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=4)
        
        csv_file = output_file.replace('.json', '.csv')
        self.save_to_csv(csv_file)
        
        print(f"Scraping completed. Saved {len(self.results)} exercises to {output_file} and {csv_file}")

    def save_to_csv(self, csv_file):
        """Save the results to a CSV file"""
        if not self.results:
            return
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ["name", "primary_muscle", "equipment", "experience_level", 
                         "overview", "instructions", "tips", "video_front", "video_side", "source_url"]
            
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for result in self.results:
                result_copy = result.copy()
                
                if isinstance(result_copy.get("overview"), list):
                    result_copy["overview"] = " | ".join(result_copy["overview"])
                if isinstance(result_copy.get("instructions"), list):
                    result_copy["instructions"] = " | ".join(result_copy["instructions"])
                if isinstance(result_copy.get("tips"), list):
                    result_copy["tips"] = " | ".join(result_copy["tips"])
                
                video_urls = result_copy.pop("video_urls", {})
                result_copy["video_front"] = video_urls.get("front", "")
                result_copy["video_side"] = video_urls.get("side", "")
                
                writer.writerow(result_copy)


if __name__ == "__main__":
    scraper = MuscleWikiScraper()
    scraper.run(delay=1)