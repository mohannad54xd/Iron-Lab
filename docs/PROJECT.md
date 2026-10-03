# IRON LAB — Project Vision

IRON LAB is a chemistry laboratory experience built around the extraction of iron and the reaction network associated with it. The experience does not present chemistry as static notes; it makes the user perform the experiment, observe the change, measure the result, and only then reveal the scientific conclusion.

## User journey

1. Landing
2. Mission briefing
3. Ore selection
4. Crushing
5. Sintering
6. Concentration
7. Roasting
8. Reduction
9. Iron unlocked
10. Reaction map
11. Reaction lab
12. Hidden discoveries
13. Final completion map

## Interaction philosophy

Action → visual result → measurement → conclusion → equation.

The experience is intentionally framed as a lab bench, not a quiz, and the scientific content is driven from source data rather than component logic.

## Visual direction

- Warm paper background
- dark charcoal type
- iron rust, oxide red, chemistry blue, and green accents
- minimal diagrams and connection lines
- real laboratory friction, measurement, and process focus

## Animation principles

- Use GSAP to animate crushing particles, furnace reactions, and map reveals.
- The animation must explain the science, not decorate it.
- Objects should physically move, separate, and recombine.

## Component architecture

- App shell and routing live under src/app.
- Chemistry content lives under src/data.
- Interaction scenes live under src/components and src/scenes.
- State and progress live under src/state and src/hooks.

## TODOs

- Replace placeholder reaction entries with fully source-verified equations from the PDF when the exact material is extracted.
- Expand the remaining stage flows beyond Crushing once the source material is fully catalogued.
