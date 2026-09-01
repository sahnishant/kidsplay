# #112 implementation notes

The implementation follows three reusable layers:

1. **Presentation-only subject variants** establish an animation identity without changing canonical knowledge.
2. **Semantic compositions** combine one subject with reusable props, relations and context.
3. **Existing scene IDs** point to compositions, preserving all existing consumers while upgrading rendering behavior.

Wind is the key reuse example: windmill, kite and sailboat scenes share `semanticRef: "wind"`. The resolver distinguishes them by required prop visual refs, proving that the same semantic identity can generate multiple faithful teaching scenes without question-specific animation code.

The germination composition deliberately represents the full canonical three-stage process statically. Motion is enhancement only.
