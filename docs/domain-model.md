# Initial Domain Model

This document records the first contract draft. TypeScript definitions will become the executable source of truth.

```ts
type EntityId = string;
type Revision = number;

type Point2D = {
  xMm: number;
  yMm: number;
};

type SurfaceReference = {
  objectId: EntityId;
  roomId: EntityId;
  surfaceId: EntityId;
  sourceService: "geometry";
  sourceRevision: Revision;
};

type TileProject = {
  schemaVersion: number;
  projectId: EntityId;
  objectId: EntityId;
  revision: Revision;
  surfaceRefs: SurfaceReference[];
  materials: TileMaterial[];
  materialAssignments: MaterialAssignment[];
  layouts: SurfaceLayout[];
  impactBindings: ImpactBinding[];
};

type TileMaterial = {
  id: EntityId;
  name: string;
  productId?: EntityId;
  size: {
    widthMm: number;
    heightMm: number;
    thicknessMm: number;
  };
  appearance?: TileAppearance;
};

type TileAppearance = {
  assetId: EntityId;
  mappingMode: "per-tile" | "continuous";
  scale: number;
  rotationDeg: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type MaterialAssignment = {
  id: EntityId;
  surfaceId: EntityId;
  materialId: EntityId;
  zoneId?: EntityId;
};

type SurfaceLayout = {
  id: EntityId;
  surfaceId: EntityId;
  materialAssignmentId: EntityId;
  pattern: "straight" | "offset";
  angleDeg: number;
  groutMm: number;
  originMm: Point2D;
  offsetFraction?: number;
  reservePercent: number;
};

type SurfaceImpactDto = {
  id: EntityId;
  revision: Revision;
  sourceService: string;
  sourceEntityId: EntityId;
  objectId: EntityId;
  roomId: EntityId;
  surfaceId: EntityId;
  effectType: "penetration" | "cutout" | "notch";
  geometry:
    | {
        kind: "circle";
        centerMm: Point2D;
        diameterMm: number;
      }
    | {
        kind: "rectangle";
        originMm: Point2D;
        widthMm: number;
        heightMm: number;
      };
  status: "active" | "removed";
};

type ImpactBinding = {
  impactId: EntityId;
  sourceRevision: Revision;
  surfaceId: EntityId;
  handling: "automatic" | "manual" | "ignored";
};

type TileOperation =
  | {
      kind: "circular-hole";
      sourceImpactId: EntityId;
      tileInstanceId: EntityId;
      diameterMm: number;
    }
  | {
      kind: "rectangular-cutout";
      sourceImpactId: EntityId;
      tileInstanceId: EntityId;
      widthMm: number;
      heightMm: number;
    }
  | {
      kind: "edge-notch";
      sourceImpactId: EntityId;
      tileInstanceId: EntityId;
    };
```

## Core invariants

Executable versions belong in dedicated invariant files.

- IDs are unique within a project.
- All dimensions are positive and expressed in millimeters.
- Every material assignment references an existing material and imported surface.
- Every layout references an existing material assignment.
- Every impact binding references an imported impact on the same surface.
- Removed impacts do not produce active tile operations.
- A project loaded from persistence is migrated and validated before entering application state.
- Derived tile instances, SVG nodes, object URLs, and quantity results are not persisted as the editable project model.
