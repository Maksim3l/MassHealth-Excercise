import subprocess
import sys
import runpy

subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

subprocess.check_call([sys.executable, "-m", "playwright", "install"])

subprocess.run([sys.executable, "harvester.py"])
