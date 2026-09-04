#!/usr/bin/env python3
"""Generate the bounded Kidsplay V1 spoken candidate pack.

Engineering use only. Generated voices remain candidate/HUMAN-review material;
this script must never promote an asset to approved runtime playback.
Requires `espeak`, `ffmpeg` and `ffprobe` on the production workstation/CI job.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
STORIES_PATH = REPO / "content" / "stories" / "v1-candidates.json"
OUTPUT_ROOT = REPO / "public" / "audio" / "kidsplay-v1"
MANIFEST_PATH = REPO / "content" / "audio" / "kidsplay-v1-candidate-manifest.json"

PROFILES = {
    "dheu": {"voice": "en+f3", "speed": 155, "pitch": 62},
    "scientu": {"voice": "en+f2", "speed": 142, "pitch": 48},
    "shaitanu": {"voice": "en+m3", "speed": 165, "pitch": 38},
    "bedtime": {"voice": "en+f3", "speed": 112, "pitch": 52},
    "shaitanu_story": {"voice": "en+m3", "speed": 145, "pitch": 38},
    "scientu_story": {"voice": "en+f2", "speed": 132, "pitch": 47},
}

NON_STORY = [
    ("character.dheu.success", "characters/dheu/success.ogg", "Yay! You found it. Nice looking!", "dheu"),
    ("character.dheu.retry", "characters/dheu/retry.ogg", "Almost! Look closely and try once more.", "dheu"),
    ("character.scientu.success", "characters/scientu/success.ogg", "Hmm! That makes sense. Great discovery!", "scientu"),
    ("character.scientu.retry", "characters/scientu/retry.ogg", "Let us think again. What clue can we notice?", "scientu"),
    ("character.shaitanu.success", "characters/shaitanu/success.ogg", "Ha! Brilliant! I knew you had it!", "shaitanu"),
    ("character.shaitanu.retry", "characters/shaitanu/retry.ogg", "Oopsie! That one fooled us. Try another!", "shaitanu"),
    ("common.success", "common/success.ogg", "You did it!", "dheu"),
    ("common.retry", "common/retry.ogg", "Try again.", "dheu"),
    ("forest.prompt.look", "forest/look.ogg", "Look around the forest. What can you spot near the trees?", "dheu"),
    ("forest.prompt.listen", "forest/listen.ogg", "Listen carefully. Which forest sound can you find?", "dheu"),
    ("prereader.vocabulary.sun", "prereader/word-sun.ogg", "Sun.", "dheu"),
    ("prereader.phoneme.m", "prereader/phoneme-m.ogg", "Mmm. M says mmm, like moon.", "dheu"),
]

STORY_OUTPUT = {
    "story.dheu.moonlit-leaf": ("stories/dheu-moonlit-leaf", "bedtime"),
    "story.friends.quiet-backpack": ("stories/friends-quiet-backpack", "bedtime"),
    "story.shaitanu.cape-trouble": ("stories/shaitanu-cape-trouble", "shaitanu_story"),
    "story.scientu.tiny-question": ("stories/scientu-tiny-question", "scientu_story"),
}


def require_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise RuntimeError(f"Required candidate-audio production tool is missing: {name}")


def duration_ms(path: Path) -> int:
    raw = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        text=True,
    ).strip()
    return round(float(raw) * 1000)


def generate_clip(utterance_id: str, relative_path: str, text: str, profile_id: str) -> dict[str, object]:
    profile = PROFILES[profile_id]
    output = OUTPUT_ROOT / relative_path
    output.parent.mkdir(parents=True, exist_ok=True)
    wav = output.with_suffix(".wav")
    subprocess.run(
        [
            "espeak",
            "-v", str(profile["voice"]),
            "-s", str(profile["speed"]),
            "-p", str(profile["pitch"]),
            "-w", str(wav),
            text,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(wav), "-ac", "1", "-ar", "24000",
            "-c:a", "libopus", "-b:a", "8k", "-vbr", "on",
            "-compression_level", "10", "-application", "voip", str(output),
        ],
        check=True,
    )
    wav.unlink(missing_ok=True)
    payload = output.read_bytes()
    return {
        "id": utterance_id,
        "bundledSrc": f"/audio/kidsplay-v1/{relative_path}",
        "durationMs": duration_ms(output),
        "bytes": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "reviewStatus": "candidate",
        "generatorProfile": profile_id,
    }


def main() -> int:
    for tool in ("espeak", "ffmpeg", "ffprobe"):
        require_tool(tool)

    stories = json.loads(STORIES_PATH.read_text(encoding="utf-8"))
    by_id = {story["storyId"]: story for story in stories}
    if set(by_id) != set(STORY_OUTPUT):
        raise RuntimeError("V1 story catalogue changed; update candidate narration production mapping explicitly")

    entries: list[dict[str, object]] = []
    for utterance_id, relative_path, text, profile_id in NON_STORY:
        entries.append(generate_clip(utterance_id, relative_path, text, profile_id))

    story_summaries: dict[str, dict[str, int]] = {}
    for story_id, (directory, profile_id) in STORY_OUTPUT.items():
        story = by_id[story_id]
        generated: list[dict[str, object]] = []
        for index, beat in enumerate(story["beats"], start=1):
            utterance_id = f"{story_id}.beat-{index:02d}"
            relative_path = f"{directory}/beat-{index:02d}.ogg"
            generated.append(generate_clip(utterance_id, relative_path, beat["text"], profile_id))
        entries.extend(generated)
        story_summaries[story_id] = {
            "clipCount": len(generated),
            "durationMs": sum(int(item["durationMs"]) for item in generated),
            "bytes": sum(int(item["bytes"]) for item in generated),
        }

    if len(entries) != 39:
        raise RuntimeError(f"Expected exactly 39 V1 candidate utterances, generated {len(entries)}")

    manifest = {
        "schemaVersion": 1,
        "packId": "kidsplay.voice.candidates.v1",
        "codec": "ogg_opus",
        "reviewStatus": "candidate",
        "humanApprovalRequired": True,
        "generator": {
            "engine": "espeak",
            "encoder": "ffmpeg-libopus",
            "sampleRateHz": 24000,
            "targetBitrate": "8k",
        },
        "summary": {
            "utteranceCount": len(entries),
            "bundledBytes": sum(int(item["bytes"]) for item in entries),
            "measuredDurationMs": sum(int(item["durationMs"]) for item in entries),
            "projectedPackageImpactBytes": sum(int(item["bytes"]) for item in entries),
            "stories": story_summaries,
        },
        "entries": entries,
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(manifest["summary"], indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
