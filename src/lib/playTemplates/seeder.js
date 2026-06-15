/**
 * Library seeder — populates LibraryPack / LibraryItem / LibraryBundle in the
 * Base44 entity store using the canonical SEED_* arrays from `librarySeeds.js`
 * and the enriched diagrams in `playTemplates.js`.
 *
 * Safe to call multiple times: detects existing packs by name and skips them.
 */

import { base44 } from '../../api/base44Client';
import { SEED_PACKS, SEED_ITEMS, SEED_BUNDLES } from '../librarySeeds';
import { buildDiagramForItem, EXTENDED_TEMPLATES, resolveExtendedDiagram } from './playTemplates';

// Map a SEED_ITEM (or EXTENDED entry) to the LibraryPack it belongs in.
function resolvePackId(item, packsByFamilyAndType) {
  const sof = item.side_of_ball;
  const fam = item.pack_system_family || item.system_family;
  const key = `${sof}:${fam}`;
  if (packsByFamilyAndType[key]) return packsByFamilyAndType[key];

  if (item.situation_tags?.some(t => ['red_zone', 'goal_line', 'short_yardage'].includes(t))) {
    const k = `${sof}:Multiple`;
    if (packsByFamilyAndType[k]) return packsByFamilyAndType[k];
  }
  if (item.item_type === 'special_teams') {
    return packsByFamilyAndType['special_teams'] || null;
  }
  if (item.item_type === 'formation') {
    return packsByFamilyAndType[`${sof}:formation`] || null;
  }
  return null;
}

/**
 * Seed the starter library for a team. Idempotent-ish: skips packs that
 * already exist with the same name.
 */
export async function seedStarterLibrary(teamId) {
  const existing = (await base44.entities.LibraryPack.list?.()) || [];
  const existingByName = Object.fromEntries(existing.map(p => [p.pack_name, p]));

  const packsByName = { ...existingByName };
  let created = 0;
  for (const seed of SEED_PACKS) {
    if (packsByName[seed.pack_name]) continue;
    const pack = await base44.entities.LibraryPack.create({
      ...seed,
      installed: true,
      install_status: 'installed',
      seeded_at: new Date().toISOString(),
    });
    packsByName[seed.pack_name] = pack;
    created++;
  }

  const packsByFamilyAndType = {};
  for (const p of Object.values(packsByName)) {
    const sof = p.side_of_ball || 'offense';
    const fam = p.system_family || 'Multiple';
    packsByFamilyAndType[`${sof}:${fam}`] = p.id;
    if (p.pack_type === 'special_teams_bundle' || p.system_family === 'Special Teams') {
      packsByFamilyAndType['special_teams'] = p.id;
    }
    if (p.pack_type === 'formation_pack') {
      packsByFamilyAndType[`${sof}:formation`] = p.id;
    }
  }

  packsByFamilyAndType['offense:I-Formation'] ||= packsByName['Youth I-Formation Starter']?.id;
  packsByFamilyAndType['offense:Spread']      ||= packsByName['Youth Shotgun Spread Core']?.id;
  packsByFamilyAndType['offense:Wing-T']      ||= packsByName['Wing-T Starter Package']?.id;
  packsByFamilyAndType['offense:Multiple']    ||= packsByName['Red Zone & Goal Line Bundle']?.id;
  packsByFamilyAndType['defense:4-4']         ||= packsByName['4-4 Defense & Pressure Package']?.id;
  packsByFamilyAndType['defense:6-2']         ||= packsByName['Youth 6-2 Defense Starter']?.id;
  packsByFamilyAndType['defense:5-3']         ||= packsByName['5-3 Defense Package']?.id;
  packsByFamilyAndType['special_teams']       ||=
    packsByName['Special Teams Essentials']?.id ||
    Object.values(packsByName).find(p => p.system_family === 'Special Teams')?.id;
  packsByFamilyAndType['offense:formation']   ||= packsByName['Formation Templates (Offense)']?.id;

  const existingItems = (await base44.entities.LibraryItem.list?.()) || [];
  const existingItemKeys = new Set(existingItems.map(i => `${i.pack_id}::${i.item_name}`));

  let itemsCreated = 0, itemsSkipped = 0;
  const allSeedItems = [
    ...SEED_ITEMS.map(s => ({ ...s, _source: 'seed' })),
    ...EXTENDED_TEMPLATES.map(e => ({ ...e, _source: 'extended' })),
  ];

  for (const seed of allSeedItems) {
    const packId = resolvePackId(seed, packsByFamilyAndType);
    if (!packId) { itemsSkipped++; continue; }
    const dedupeKey = `${packId}::${seed.item_name}`;
    if (existingItemKeys.has(dedupeKey)) { itemsSkipped++; continue; }

    let diagram = null;
    if (seed._source === 'extended') {
      diagram = resolveExtendedDiagram(seed);
    } else {
      diagram = buildDiagramForItem(seed.item_name);
    }

    const { _source, pack_system_family, diagram_data: _drop, ...rest } = seed;
    await base44.entities.LibraryItem.create({
      ...rest,
      pack_id: packId,
      diagram_data: diagram,
    });
    itemsCreated++;
  }

  const existingBundles = (await base44.entities.LibraryBundle.list?.()) || [];
  const bundleNames = new Set(existingBundles.map(b => b.bundle_name));
  let bundlesCreated = 0;
  for (const bundle of SEED_BUNDLES) {
    if (bundleNames.has(bundle.bundle_name)) continue;
    await base44.entities.LibraryBundle.create({
      ...bundle,
      created_at: new Date().toISOString(),
    });
    bundlesCreated++;
  }

  return { packs: created, items: itemsCreated, bundles: bundlesCreated, skipped: itemsSkipped, teamId };
}