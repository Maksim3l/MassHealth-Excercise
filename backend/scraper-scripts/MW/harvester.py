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
        
        # Try multiple selector patterns to find the instructions container
        steps_container = None
        possible_selectors = [
            "dl[class*='my-5'][class*='grid']",
            "dl.my-5",
            "dl.grid",
            "dl.space-y-2",
            "div.sm\\:pb-5 div.flex.flex-col dl"
        ]
        
        for selector in possible_selectors:
            steps_container = soup.select_one(selector)
            if steps_container:
                break
                
        if steps_container:
            # Look for all divs with the border-gray-200 class that contain the steps
            steps = steps_container.find_all("div", class_="border-gray-200")
            
            if not steps:  # Try alternative approach
                steps = steps_container.find_all("div")
            
            for step in steps:
                # Extract text from the dd element which contains the instruction
                dd_element = step.find("dd")
                if dd_element:
                    step_text = dd_element.get_text(strip=True)
                    if step_text:
                        instructions.append(step_text)
        
        # If no instructions found, try a more generic approach
        if not instructions:
            step_elements = soup.select("dl dd")
            for step in step_elements:
                step_text = step.get_text(strip=True)
                if step_text:
                    instructions.append(step_text)

        return instructions

    def extract_detailed_instructions(self, soup):
        """Extract detailed instructions and tips from various layouts"""
        detailed_info = {"instructions": [], "tips": []}

        # Try multiple possible containers
        containers = [
            soup.select_one("div.mb-8.rounded-lg.border.bg-white"),
            soup.select_one("div.rounded-lg.border.bg-white"),
            soup.select_one("div.mb-8")
        ]
        
        container = next((c for c in containers if c is not None), None)

        if container:
            instructions = []
            tips = []

            # Try to find sections by headers
            sections = {}
            current_section = None
            
            for elem in container.find_all(['h2', 'h3', 'p']):
                if elem.name in ['h2', 'h3']:
                    text = elem.get_text(strip=True).lower()
                    if 'how to' in text or 'instruction' in text:
                        current_section = 'instructions'
                    elif 'tip' in text or 'advice' in text:
                        current_section = 'tips'
                    else:
                        current_section = text  # Use header text as section name
                        
                    # Initialize the section if it doesn't exist
                    if current_section not in sections:
                        sections[current_section] = []
                        
                elif elem.name == 'p' and current_section:
                    text = elem.get_text(strip=True)
                    if text:
                        sections[current_section].append(text)
            
            # Map sections to our expected output
            for section, texts in sections.items():
                if section == 'instructions' or 'how to' in section:
                    detailed_info["instructions"].extend(texts)
                elif section == 'tips' or 'tip' in section:
                    detailed_info["tips"].extend(texts)
        
        # Fallback: if no structured sections found, try to extract paragraphs
        if not detailed_info["instructions"] and not detailed_info["tips"]:
            all_paragraphs = soup.find_all("p", class_="text-left")
            if not all_paragraphs:
                all_paragraphs = soup.find_all("p")
                
            in_instructions = False
            in_tips = False
            
            for p in all_paragraphs:
                text = p.get_text(strip=True)
                if not text:
                    continue
                    
                lower_text = text.lower()
                
                if "how to" in lower_text or "instruction" in lower_text:
                    in_instructions = True
                    in_tips = False
                    continue
                elif "tip" in lower_text or "advice" in lower_text:
                    in_tips = True
                    in_instructions = False
                    continue
                    
                if in_instructions:
                    detailed_info["instructions"].append(text.replace("**", "").strip())
                elif in_tips:
                    detailed_info["tips"].append(text.replace("**", "").strip())

        return detailed_info

    def extract_video_urls(self, soup):
        """Extract all video URLs from the page"""
        video_urls = []
        
        # Find all video sources
        video_elements = soup.select("video.rounded-lg source")
        if not video_elements:
            video_elements = soup.select("video source")
            
        for video in video_elements:
            if video.has_attr("src"):
                video_url = video["src"]
                # Ensure URL is absolute
                if not video_url.startswith(('http://', 'https://')):
                    video_url = urljoin(self.base_url, video_url)
                video_urls.append(video_url)
        
        # Try alternative methods if no videos found
        if not video_urls:
            # Look for video elements directly
            for video in soup.find_all("video"):
                if video.has_attr("src"):
                    video_url = video["src"]
                    if not video_url.startswith(('http://', 'https://')):
                        video_url = urljoin(self.base_url, video_url)
                    video_urls.append(video_url)
        
        # Return a dictionary with front and side views if available
        result = {}
        if len(video_urls) >= 1:
            result["front"] = video_urls[0]
        if len(video_urls) >= 2:
            result["side"] = video_urls[1]
            
        return result

    def scrape_exercise_page(self, target_url, page):
        male_url = target_url.get("male", "")
        if not male_url:
            return None

        full_url = urljoin(self.base_url, male_url)
        print(f"\tProcessing {full_url}")

        try:
            page.goto(full_url, wait_until="domcontentloaded")
            page.wait_for_load_state("networkidle")

            try:
                page.wait_for_selector("video", timeout=5000)
            except:
                pass

            try:
                page.wait_for_selector("dl", timeout=5000)
            except:
                print("Warning: Could not find instruction steps")

            page.evaluate("""() => {
                window.scrollTo(0, document.body.scrollHeight);
                setTimeout(() => window.scrollTo(0, 0), 1000);
            }""")
            page.wait_for_timeout(2000)

            html = page.content()
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
            print(f"Error scraping {full_url}: {e}")
            return None


    def process_exercise(self, exercise, page):
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
        
        # Implement retry mechanism for reliability
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                detailed_info = self.scrape_exercise_page(exercise.get("target_url", {}), page)
                
                if detailed_info:
                    exercise_data.update(detailed_info)
                    break  # Success, exit retry loop
                    
            except Exception as e:
                print(f"Attempt {attempt+1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
    
        return exercise_data

    def run(self, output_file="musclewiki_exercises.json", delay=1, max_exercises=None):
        exercises = self.get_exercises_from_api()

        if max_exercises:
            exercises = exercises[:max_exercises]

        total = len(exercises)
        print(f"Found {total} exercises. Starting to process...")

        with sync_playwright() as p:
            browser = p.firefox.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent=self.headers["User-Agent"]
            )
            page = context.new_page()

            for i, exercise in enumerate(exercises):
                print(f"Processing exercise {i+1}/{total}: {exercise.get('name', 'Unknown')}")
                result = self.process_exercise(exercise, page)

                if result:
                    self.results.append(result)
                    if (i + 1) % 10 == 0 or i == total - 1:
                        with open(output_file, 'w', encoding='utf-8') as f:
                            json.dump(self.results, f, indent=4)
                        print(f"Progress saved: {i+1}/{total} exercises")

                if i < total - 1:
                    actual_delay = delay + (delay * 0.5 * (time.time() % 1))
                    print(f"Waiting {actual_delay:.2f} seconds before next request...")
                    time.sleep(actual_delay)

            browser.close()

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
    # You can limit the number of exercises during testing
    # scraper.run(delay=2, max_exercises=5)
    scraper.run(delay=2)