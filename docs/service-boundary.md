# Tile Planner Service Boundary

## Responsibility

`tile-planner-service` plans tile materials and layouts on surfaces imported from the platform and derives tile-specific installation quantities.

The service owns:

- tile projects;
- tile materials and appearance settings;
- material assignments to surfaces;
- tile layout parameters;
- derived tile instances and cut classification;
- tile-specific interpretation of imported surface impacts;
- tile installation quantities for the estimate service.

The service does not own:

- canonical building geometry;
- customer or object cards;
- plumbing design;
- electrical design;
- platform-wide asset storage;
- estimate pricing or price catalogs.

## Upstream dependencies

### Geometry service

Provides stable surface identifiers, room identifiers, real-world dimensions, polygons, openings, units, and source revisions.

The tile planner stores references to canonical surfaces and the revision used for the last calculation. It must not silently fork or redefine canonical geometry.

### Plumbing and electrical services

Provide versioned surface impacts such as penetrations, rectangular cutouts, and notches.

The tile planner does not interpret internal plumbing or electrical entities. It consumes normalized impacts and converts them into tile installation operations.

### Project or object service

Provides the object context and identifies which planner services participate in the project.

## Downstream dependency

### Estimate service

Consumes versioned quantity payloads. The estimate service applies prices and combines estimate rows; the tile planner only derives physical and labor-operation quantities.

## Source-of-truth rules

- SVG is a renderer, not the project model.
- Surface geometry is owned by the geometry service.
- Imported impacts remain owned by their source services.
- Tile materials, layouts, and tile operation interpretations are owned by this service.
- Derived tile polygons and render descriptors are recalculated and are not durable project data.

## Durable model

The durable model contains:

- `schemaVersion`;
- `projectId` and `objectId`;
- stable surface references and source revisions;
- material definitions and assignments;
- layout parameters;
- impact bindings and source revisions;
- project revision.

Transient editor state, SVG elements, clip paths, object URLs, hover state, open menus, and calculated render polygons are not saved.

## Change propagation

When an imported surface or impact revision changes, dependent tile calculations become outdated.

A suggested workflow is:

1. receive or fetch the new source revision;
2. compare it with the revision stored in the tile project;
3. mark affected surfaces as outdated;
4. show the change to the user;
5. refresh bindings and recalculate;
6. export a new quantity revision.

Approved estimates should not be silently overwritten by upstream changes.
