import sys
from pathlib import Path


AI_ENGINE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ENGINE_ROOT))
