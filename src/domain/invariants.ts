import {
  TILE_PROJECT_SCHEMA_VERSION,
  type EntityId,
  type SurfaceImpactDto,
  type TileMaterial,
  type TileProject,
} from "./model.js";

export interface ValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

function issue(code: string, path: string, message: string): ValidationIssue {
  return { code, path, message };
}

function collectDuplicateIds(
  values: readonly { readonly id: EntityId }[],
  path: string,
): ValidationIssue[] {
  const seen = new Set<EntityId>();
  const duplicates = new Set<EntityId>();

  for (const value of values) {
    if (seen.has(value.id)) duplicates.add(value.id);
    seen.add(value.id);
  }

  return [...duplicates].map((id) =>
    issue("duplicate-id", path, `Duplicate durable ID: ${id}`),
  );
}

function validateMaterial(material: TileMaterial, index: number): ValidationIssue[] {
  const path = `materials[${index}]`;
  const issues: ValidationIssue[] = [];
  if (!material.id.trim()) issues.push(issue("empty-id", `${path}.id`, "Material ID is required"));
  if (!material.name.trim()) issues.push(issue("empty-name", `${path}.name`, "Material name is required"));
  if (material.widthMm <= 0) issues.push(issue("non-positive-size", `${path}.widthMm`, "Tile width must be positive"));
  if (material.heightMm <= 0) issues.push(issue("non-positive-size", `${path}.heightMm`, "Tile height must be positive"));
  if (material.thicknessMm <= 0) issues.push(issue("non-positive-size", `${path}.thicknessMm`, "Tile thickness must be positive"));
  if (material.appearance && material.appearance.scale <= 0) {
    issues.push(issue("non-positive-scale", `${path}.appearance.scale`, "Texture scale must be positive"));
  }
  return issues;
}

function validateImpact(impact: SurfaceImpactDto, index: number): ValidationIssue[] {
  const path = `importedImpacts[${index}]`;
  const issues: ValidationIssue[] = [];
  if (impact.revision < 0 || !Number.isInteger(impact.revision)) {
    issues.push(issue("invalid-revision", `${path}.revision`, "Impact revision must be a non-negative integer"));
  }
  if (impact.geometry.kind === "circle" && impact.geometry.diameterMm <= 0) {
    issues.push(issue("non-positive-size", `${path}.geometry.diameterMm`, "Hole diameter must be positive"));
  }
  if (impact.geometry.kind === "rectangle") {
    if (impact.geometry.widthMm <= 0) issues.push(issue("non-positive-size", `${path}.geometry.widthMm`, "Cutout width must be positive"));
    if (impact.geometry.heightMm <= 0) issues.push(issue("non-positive-size", `${path}.geometry.heightMm`, "Cutout height must be positive"));
  }
  return issues;
}

export function validateTileProject(project: TileProject): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (project.schemaVersion !== TILE_PROJECT_SCHEMA_VERSION) {
    issues.push(issue("unsupported-schema", "schemaVersion", `Expected schema version ${TILE_PROJECT_SCHEMA_VERSION}`));
  }
  if (!project.projectId.trim()) issues.push(issue("empty-id", "projectId", "Project ID is required"));
  if (!project.objectId.trim()) issues.push(issue("empty-id", "objectId", "Object ID is required"));
  if (project.revision < 0 || !Number.isInteger(project.revision)) {
    issues.push(issue("invalid-revision", "revision", "Project revision must be a non-negative integer"));
  }

  issues.push(...collectDuplicateIds(project.materials, "materials"));
  issues.push(...collectDuplicateIds(project.layouts, "layouts"));
  issues.push(...collectDuplicateIds(project.importedImpacts, "importedImpacts"));
  issues.push(...collectDuplicateIds(project.tileOperations, "tileOperations"));
  project.materials.forEach((material, index) => issues.push(...validateMaterial(material, index)));
  project.importedImpacts.forEach((impact, index) => issues.push(...validateImpact(impact, index)));

  const surfaceIds = new Set(project.surfaces.map((surface) => surface.surfaceId));
  const materialIds = new Set(project.materials.map((material) => material.id));
  const impactIds = new Set(project.importedImpacts.map((impact) => impact.id));
  const operationIds = new Set(project.tileOperations.map((operation) => operation.id));

  project.layouts.forEach((layout, index) => {
    const path = `layouts[${index}]`;
    if (!surfaceIds.has(layout.surfaceId)) issues.push(issue("unknown-reference", `${path}.surfaceId`, "Layout references an unknown surface"));
    if (!materialIds.has(layout.materialId)) issues.push(issue("unknown-reference", `${path}.materialId`, "Layout references an unknown material"));
    if (layout.groutMm < 0) issues.push(issue("negative-value", `${path}.groutMm`, "Grout width cannot be negative"));
    if (layout.reservePercent < 0) issues.push(issue("negative-value", `${path}.reservePercent`, "Reserve percent cannot be negative"));
    if (layout.offsetFraction < 0 || layout.offsetFraction >= 1) issues.push(issue("out-of-range", `${path}.offsetFraction`, "Offset fraction must be in [0, 1)"));
  });

  project.importedImpacts.forEach((impact, index) => {
    if (!surfaceIds.has(impact.surfaceId)) issues.push(issue("unknown-reference", `importedImpacts[${index}].surfaceId`, "Impact references an unknown surface"));
    if (impact.objectId !== project.objectId) issues.push(issue("object-mismatch", `importedImpacts[${index}].objectId`, "Impact belongs to another object"));
  });

  project.impactBindings.forEach((binding, index) => {
    const path = `impactBindings[${index}]`;
    if (!impactIds.has(binding.impactId)) issues.push(issue("unknown-reference", `${path}.impactId`, "Binding references an unknown impact"));
    if (!operationIds.has(binding.tileOperationId)) issues.push(issue("unknown-reference", `${path}.tileOperationId`, "Binding references an unknown tile operation"));
  });

  project.tileOperations.forEach((operation, index) => {
    const path = `tileOperations[${index}]`;
    if (!surfaceIds.has(operation.surfaceId)) issues.push(issue("unknown-reference", `${path}.surfaceId`, "Operation references an unknown surface"));
    if (!impactIds.has(operation.sourceImpactId)) issues.push(issue("unknown-reference", `${path}.sourceImpactId`, "Operation references an unknown source impact"));
  });

  return { valid: issues.length === 0, issues };
}

export function assertValidTileProject(project: TileProject): void {
  const result = validateTileProject(project);
  if (!result.valid) {
    throw new Error(result.issues.map((entry) => `${entry.path}: ${entry.message}`).join("\n"));
  }
}
