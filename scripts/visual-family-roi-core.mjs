export function buildProductionFamilyQueue(entries) {
  const families = new Map();

  for (const entry of entries) {
    if (entry?.automaticEligible !== true || !entry?.familyKey) continue;
    const existing = families.get(entry.familyKey) ?? {
      familyKey: entry.familyKey,
      roiScore: 0,
      occurrenceCount: 0,
      semanticRefs: new Set(),
      engines: new Set(),
      profiles: new Set(),
      suggestedTemplates: new Set(),
      costClasses: new Set()
    };
    existing.roiScore += Number(entry.roiScore ?? 0);
    existing.occurrenceCount += Number(entry.occurrenceCount ?? 0);
    if (entry.semanticRef) existing.semanticRefs.add(entry.semanticRef);
    for (const engine of entry.engines ?? []) existing.engines.add(engine);
    for (const profile of entry.profiles ?? []) existing.profiles.add(profile);
    if (entry.suggestedTemplate) existing.suggestedTemplates.add(entry.suggestedTemplate);
    if (entry.costClass) existing.costClasses.add(entry.costClass);
    families.set(entry.familyKey, existing);
  }

  return [...families.values()].map((family) => ({
    familyKey: family.familyKey,
    roiScore: Math.round(family.roiScore * 10) / 10,
    occurrenceCount: family.occurrenceCount,
    semanticRefs: [...family.semanticRefs].sort(),
    engineBreadth: family.engines.size,
    engines: [...family.engines].sort(),
    profileBreadth: family.profiles.size,
    profiles: [...family.profiles].sort(),
    suggestedTemplates: [...family.suggestedTemplates].sort(),
    costClasses: [...family.costClasses].sort()
  })).sort((left, right) =>
    right.roiScore - left.roiScore ||
    right.occurrenceCount - left.occurrenceCount ||
    left.familyKey.localeCompare(right.familyKey)
  );
}
