export const TILE_PROJECT_SCHEMA_VERSION = 1 as const;

export type Millimeters = number;
export type Degrees = number;
export type EntityId = string;

export interface Point2D {
  readonly xMm: Millimeters;
  readonly yMm: Millimeters;
}

export interface SurfaceReference {
  readonly objectId: EntityId;
  readonly roomId: EntityId;
  readonly surfaceId: EntityId;
  readonly sourceService: "geometry";
  readonly sourceRevision: number;
}

export interface TileAppearance {
  readonly assetId: EntityId;
  readonly mappingMode: "per-tile" | "continuous";
  readonly scale: number;
  readonly rotationDeg: Degrees;
  readonly crop?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface TileMaterial {
  readonly id: EntityId;
  readonly name: string;
  readonly productId?: EntityId;
  readonly widthMm: Millimeters;
  readonly heightMm: Millimeters;
  readonly thicknessMm: Millimeters;
  readonly appearance?: TileAppearance;
}

export interface SurfaceLayout {
  readonly id: EntityId;
  readonly surfaceId: EntityId;
  readonly materialId: EntityId;
  readonly pattern: "straight" | "offset";
  readonly offsetFraction: number;
  readonly groutMm: Millimeters;
  readonly rotationDeg: Degrees;
  readonly originMm: Point2D;
  readonly reservePercent: number;
}

export type SurfaceImpactGeometry =
  | {
      readonly kind: "circle";
      readonly centerMm: Point2D;
      readonly diameterMm: Millimeters;
    }
  | {
      readonly kind: "rectangle";
      readonly originMm: Point2D;
      readonly widthMm: Millimeters;
      readonly heightMm: Millimeters;
    };

export interface SurfaceImpactDto {
  readonly id: EntityId;
  readonly revision: number;
  readonly sourceService: "plumbing" | "electrical" | string;
  readonly sourceEntityId: EntityId;
  readonly objectId: EntityId;
  readonly roomId: EntityId;
  readonly surfaceId: EntityId;
  readonly effectType: "penetration" | "cutout" | "notch";
  readonly geometry: SurfaceImpactGeometry;
  readonly status: "active" | "removed";
}

export interface ImpactBinding {
  readonly impactId: EntityId;
  readonly sourceRevision: number;
  readonly tileOperationId: EntityId;
}

export type TileOperation =
  | {
      readonly id: EntityId;
      readonly kind: "circular-hole";
      readonly surfaceId: EntityId;
      readonly sourceImpactId: EntityId;
      readonly centerMm: Point2D;
      readonly diameterMm: Millimeters;
    }
  | {
      readonly id: EntityId;
      readonly kind: "rectangular-cutout";
      readonly surfaceId: EntityId;
      readonly sourceImpactId: EntityId;
      readonly originMm: Point2D;
      readonly widthMm: Millimeters;
      readonly heightMm: Millimeters;
    }
  | {
      readonly id: EntityId;
      readonly kind: "edge-notch";
      readonly surfaceId: EntityId;
      readonly sourceImpactId: EntityId;
      readonly geometry: SurfaceImpactGeometry;
    };

export interface TileProject {
  readonly schemaVersion: typeof TILE_PROJECT_SCHEMA_VERSION;
  readonly projectId: EntityId;
  readonly objectId: EntityId;
  readonly revision: number;
  readonly surfaces: readonly SurfaceReference[];
  readonly materials: readonly TileMaterial[];
  readonly layouts: readonly SurfaceLayout[];
  readonly importedImpacts: readonly SurfaceImpactDto[];
  readonly impactBindings: readonly ImpactBinding[];
  readonly tileOperations: readonly TileOperation[];
}

export interface DerivedSurfaceQuantities {
  readonly surfaceId: EntityId;
  readonly areaM2: number;
  readonly tilesWhole: number;
  readonly tilesCut: number;
  readonly tilesWithReserve: number;
  readonly adhesiveKg: number;
  readonly groutKg: number;
  readonly circularHoles: number;
  readonly rectangularCutouts: number;
  readonly edgeNotches: number;
}

export interface DerivedQuantities {
  readonly projectId: EntityId;
  readonly projectRevision: number;
  readonly generatedAt: string;
  readonly surfaces: readonly DerivedSurfaceQuantities[];
}
