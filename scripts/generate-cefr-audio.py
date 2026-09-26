"""Render the original CEFR practice listening scripts with local FFmpeg/flite.

Requires an FFmpeg build with the flite filter; no network calls or API keys.
"""
import json
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
entries = json.loads((root / 'data/cefr-audio-scripts.json').read_text())
output = root / 'public/cefr-audio'
output.mkdir(parents=True, exist_ok=True)

for entry in entries:
    destination = output / f"mock-{entry['mock']}-part-{entry['part']}.mp3"
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', encoding='utf-8') as script:
        script.write(entry['text'])
        script.flush()
        voice = 'slt' if entry['part'] % 2 else 'rms'
        subprocess.run([
            'ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i',
            f'flite=textfile={script.name}:voice={voice}',
            '-ar', '16000', '-ac', '1', '-b:a', '40k', str(destination)
        ], check=True)
    if destination.stat().st_size < 2000:
        raise RuntimeError(f'Audio fayli bo‘sh: {destination}')

print(f'{len(entries)} ta MP3 tayyor: {output}')
