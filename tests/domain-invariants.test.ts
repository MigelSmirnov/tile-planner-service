import assert from "node:assert/strict";
import test from "node:test";

import {
  TILE_PROJECT_SCHEMA_VERSION,
  type TileProject,
  validateTileProject,
} from "../src/domain/index.js";

function validProject(): TileProject {
  return {
    schemaVersion: TILE_PROJECT_SCHEMA_VERSION,
    projectId: "tile-project-1",
    objectId: "object-1",
    revision: 0,
    surfaces: [
      {
        objectId: "object-1",
        roomId: "bathroom-1",
        surfaceId: "wall-1",
        sourceService: "geometry",
        sourceRevision: 3,
      },
    ],
    materials: [
      {
        id: "material-1",
        name: "Porcelain 600x600",
        widthMm: 600,
        heightMm: 600,
        thicknessMm: 9,
      },
    ],
    layouts: [
      {
        id: "layout-1",
        surfaceId: "wall-1",
        materialId: "material-1",
        pattern: "straight",
        offsetFraction: 0,
        groutMm: 2,
        rotationDeg: 0,
        originMm: { xMm: 0, yMm: 0 },
        reservePercent: 10,
      },
    ],
    importedImpacts: [
      {
        id: "impact-1",
        revision: 1,
        sourceService: "plumbing",
        sourceEntityId: "water-outlet-1",
        objectId: "object-1",
        roomId: "bathroom-1",
        surfaceId: "wall-1",
        effectType: "penetration",
        geometry: {
          kind: "circle",
          centerMm: { xMm: 850, yMm: 1100 },
          diameterMm: 32,
        },
        status: "active",
      },
    ],
    impactBindings: [
      {
        impactId: "impact-1",
        sourceRevision: 1,
        tileOperationId: "operation-1",
      },
    ],
    tileOperations: [
      {
        id: "operation-1",
        kind: "circular-hole",
        surfaceId: "wall-1",
        sourceImpactId: "impact-1",
        centerMm: { xMm: 850, yMm: 1100 },
        diameterMm: 32,
      },
    ],
  };
}

test("accepts a valid tile project", () => {
  const result = validateTileProject(validProject());
  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test("rejects dangling surface and material references", () => {
  const project = validProject();
  const invalid: TileProject = {
    ...project,
    layouts: [{ ...project.layouts[0]!, surfaceId: "missing-wall", materialId: "missing-material" }],
  };

  const result = validateTileProject(invalid);
  assert.equal(result.valid, false);
  assert.equal(result.issues.filter((entry) => entry.code === "unknown-reference").length, 2);
});

test("rejects duplicate durable IDs and non-positive dimensions", () => {
  const project = validProject();
  const material = project.materials[0]!;
  const invalid: TileProject = {
    ...project,
    materials: [material, { ...material, widthMm: 0 }],
  };

  const result = validateTileProject(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((entry) => entry.code === "duplicate-id"));
  assert.ok(result.issues.some((entry) => entry.code === "non-positive-size"));
});

test("rejects impacts belonging to another object", () => {
  const project = validProject();
  const invalid: TileProject = {
    ...project,
    importedImpacts: [{ ...project.importedImpacts[0]!, objectId: "object-2" }],
  };

  const result = validateTileProject(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((entry) => entry.code === "object-mismatch"));
});
