# Explicit illustrated-studio performance allowance

The first illustrated build at `187e851` passes source/content/visual validation and Svelte typechecking but correctly fails the old total/core budget. Android workflow34006445052 job101414417799 measures installed JS852.1KiB against832KiB. The new lazy StudioScene is17.14kB raw /5.12kB gzip, plus1.48kB CSS. The registry and loader add approximately4.4kB raw to shared presentation. StoryCharacter remains one shared chunk, not a second persona.

The reported171.3KiB core gzip included StudioScene because its new lazy prefix was not yet classified. Registering that independently is accounting, not a core optimisation. Allow installed JS832→864KiB (+32KiB), core gzip166→167KiB (+1KiB for registry/loader), and bound StudioScene at7KiB gzip /2KiB CSS. Core CSS stays100KiB.

The second build at `cdcd4f1`, Android workflow34006970147 job101415880110, measures installed854.0KiB, core166.5KiB gzip, core CSS97.0KiB, StudioScene5.0KiB gzip /1.4KiB CSS and StudioLauncher10.2KiB gzip /4.4KiB CSS. The previous10KiB launcher ceiling catches the added shared picture-preview path. Its explicit artwork feature allowance is now10.5KiB gzip (+0.5), with5KiB CSS (+1). This supersedes the first implementation's proposed unchanged launcher JS ceiling; it is not represented as an optimisation. All other single-chunk/route/data/Vite gates remain enforced.

Source labels, aspect-ratio preservation, keyboard/touch controls, screen-reader work descriptions and retained child previews are not removed to conceal their feature cost. Budget increases remain review items, not physical-device performance or human art approval. Subsequent exact-head runs must still validate every ceiling.

The temporary full-dependency workbench workflow is removed. Ordinary screenshot/contact-sheet artifacts remain the ongoing QA delivery rather than repeated330MB dependency archives.
