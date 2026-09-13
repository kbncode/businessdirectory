// KBN Business Directory — seed script
// Run with: npx prisma db seed  (after adding "prisma": { "seed": "ts-node prisma/seed.ts" } to package.json)

import { PrismaClient } from '@prisma/client';
import countries from './seed-data/countries.json';
import states from './seed-data/states.json';
import cities from './seed-data/cities.json';
import businessEntities from './seed-data/business-entities.json';
import businessTypes from './seed-data/business-types.json';
import mainCategories from './seed-data/business-main-categories.json';
import subCategories from './seed-data/business-sub-categories.json';
import appMessages from './seed-data/app-messages.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding countries...');
  for (const c of countries as { id: string; name: string }[]) {
    await prisma.country.upsert({
      where: { id: c.id },
      update: { name: c.name },
      create: { id: c.id, name: c.name },
    });
  }

  console.log('Seeding states...');
  for (const s of states as { id: string; name: string; countryId: string }[]) {
    await prisma.state.upsert({
      where: { id: s.id },
      update: { name: s.name, countryId: s.countryId },
      create: { id: s.id, name: s.name, countryId: s.countryId },
    });
  }

  console.log('Seeding cities...');
  for (const c of cities as { id: string; name: string; stateId: string }[]) {
    await prisma.city.upsert({
      where: { id: c.id },
      update: { name: c.name, stateId: c.stateId },
      create: { id: c.id, name: c.name, stateId: c.stateId },
    });
  }

  console.log('Seeding business entities...');
  for (const e of businessEntities as { id: string; name: string }[]) {
    await prisma.businessEntity.upsert({
      where: { id: e.id },
      update: { name: e.name },
      create: { id: e.id, name: e.name },
    });
  }

  console.log('Seeding business types...');
  for (const t of businessTypes as { id: string; name: string }[]) {
    await prisma.businessType.upsert({
      where: { id: t.id },
      update: { name: t.name },
      create: { id: t.id, name: t.name },
    });
  }

  console.log('Seeding main categories...');
  for (const m of mainCategories as { id: string; name: string }[]) {
    await prisma.businessMainCategory.upsert({
      where: { id: m.id },
      update: { name: m.name },
      create: { id: m.id, name: m.name },
    });
  }

  console.log('Seeding sub categories...');
  for (const s of subCategories as { id: string; name: string; mainCategoryId: string }[]) {
    await prisma.businessSubCategory.upsert({
      where: { id: s.id },
      update: { name: s.name, mainCategoryId: s.mainCategoryId },
      create: { id: s.id, name: s.name, mainCategoryId: s.mainCategoryId },
    });
  }

  console.log('Seeding app messages...');
  for (const a of appMessages as { key: string; text: string }[]) {
    await prisma.appMessage.upsert({
      where: { key: a.key },
      update: { text: a.text },
      create: { key: a.key, text: a.text },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
