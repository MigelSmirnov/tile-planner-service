# tile-planner-service

Service for planning tile materials and layouts on imported building surfaces and deriving quantities for estimates.

## Service scope

The service owns:

- tile projects;
- tile materials and reference-image settings;
- material assignments to surfaces;
- tile layouts, joints, origins, angles, and patterns;
- tile-specific operations produced from imported penetrations and cutouts;
- material and installation quantities.

The service consumes canonical surfaces from the geometry service and normalized surface impacts from plumbing, electrical, and future planner services. It does not own those source entities and does not use SVG as the project model.

## Architecture rules

This repository follows the rules from [`svg-engineering-editors-skills`](https://github.com/MigelSmirnov/svg-engineering-editors-skills):

- deep modules before implementation;
- domain model separated from editor state and UI;
- real-world dimensions stored in millimeters;
- stable IDs and source revisions;
- explicit invariants and configuration files;
- versioned persistence with migrations and validation;
- editable project data saved instead of rendered SVG;
- UI as a thin command-and-rendering layer.

## Current phase

Architecture foundation. No framework or runtime dependency has been selected yet.

Key documents:

- [`architecture/app-architecture.yaml`](architecture/app-architecture.yaml) — module graph, dependencies, public boundaries, and forbidden dependencies;
- [`docs/service-boundary.md`](docs/service-boundary.md) — ownership and integration boundaries;
- [`docs/domain-model.md`](docs/domain-model.md) — initial domain contract draft.

## Planned implementation order

1. TypeScript project and quality tooling.
2. Shared primitive types and units.
3. Durable tile-project model.
4. Constants and executable invariants.
5. External surface and impact contracts.
6. Geometry module.
7. Tiling engine.
8. Tile operations and quantity calculations.
9. Persistence, migrations, and validation.
10. Application commands and undo/redo.
11. Texture mapping engine and asset adapter.
12. SVG renderer and editor UI.
13. Estimate export contract.
14. Tests and example projects.

## Important model distinction

Durable project data includes surface references, source revisions, materials, assignments, layouts, and impact bindings.

Derived tile polygons, texture render descriptors, SVG elements, clip paths, hover state, viewport state, and object URLs are recalculated or transient and are not stored as the editable project model.
