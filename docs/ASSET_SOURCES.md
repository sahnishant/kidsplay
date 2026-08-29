# Kidsplay asset-source policy and research

The asset registry at `content/assets/registry.json` is the authoritative admission ledger for external art. **A public GitHub repository is not automatically an approved art source.**

## Rules

1. No external SVG, sprite, sound or illustration is bundled until its exact source and license are recorded.
2. Code license and artwork license may differ. Record the artwork license.
3. Prefer MIT / Apache-2.0 / BSD / CC0 for reusable primitives and utility art.
4. CC-BY can be used when attribution is operationally acceptable and is automatically included in product notices.
5. Share-alike, GPL-family, unclear or per-asset licensing is reference-only unless deliberately reviewed for that exact use.
6. Never bulk-copy example assets merely because the engine/library code is permissively licensed.
7. Keep the base APK small: import only assets actually referenced by published content; richer packs can later be downloadable.

## GitHub sources reviewed so far

| Source | License signal | Status | Useful for |
| --- | --- | --- | --- |
| `tabler/tabler-icons` | MIT; repository explicitly describes 6100+ SVG icons as MIT-licensed | Approved | UI controls, arrows, generic objects and interaction symbols |
| `jdecked/twemoji` | Graphics have a separate `LICENSE-GRAPHICS` under CC-BY-4.0 | Candidate | Consistent animal/object SVGs; attribution required |
| `googlefonts/noto-emoji` | GitHub repository metadata reports OFL-1.1 | Candidate | Emoji-style animal/object reference; verify exact selected file/license first |
| `game-icons/icons` | Repository metadata reports `NOASSERTION`; licensing is not safe to assume globally | Reference only | Shape/symbol inspiration; exact asset review required |
| Platform Unicode emoji | No artwork file bundled by Kidsplay | Prototype fallback | Zero-production-cost placeholders, but inconsistent across devices |

## Character-system direction

The long-term goal is **not** to accumulate thousands of finished animations. It is a modular scene/character system:

```text
character identity
  + base body / silhouette
  + orientation (front / side)
  + pose (stand / walk / swim / sit)
  + expression (happy / afraid / curious)
  + prop (bone / ball / food / book)
  + relation cue (heart / arrow / cross / question)
  + cheap motion (bounce / wiggle / float / translate)
```

A dog-playing scene should therefore be assembled from reusable dog + happy pose + ball + small motion, not stored as a bespoke animation. A dog-in-water teaching scene can reuse the same dog identity with an afraid expression and water background.

## Next asset research

- Find a genuinely permissive **modular character/animal source** where poses or body parts can be adapted without share-alike complications.
- If no good source exists, create a very small original Kidsplay SVG kit using consistent geometric primitives and use external permissive icon/emoji sources only for props/background objects.
- Add build-time attribution generation before the first CC-BY artwork is imported.
