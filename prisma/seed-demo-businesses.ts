// One-off demo data script — NOT part of the real seed.ts, and not wired
// into `prisma db seed`. Creates a demo owner account plus a handful of
// businesses (mostly APPROVED, one PENDING) so the public directory pages
// have something real to render during development/review.
//
// Run with: npx ts-node --project prisma/tsconfig.seed.json prisma/seed-demo-businesses.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

async function main() {
  const india = await prisma.country.findFirstOrThrow({ where: { name: "India" } });
  const gujarat = await prisma.state.findFirstOrThrow({ where: { name: "Gujarat", countryId: india.id } });
  const cities = await prisma.city.findMany({ where: { stateId: gujarat.id }, take: 3 });
  const [surat, rajkot, vadodara] = cities;

  const proprietorship = await prisma.businessEntity.findFirstOrThrow();
  const entities = await prisma.businessEntity.findMany({ take: 2 });
  const types = await prisma.businessType.findMany({ take: 2 });

  const retailCategory = await prisma.businessMainCategory.findFirstOrThrow({ where: { name: "Retail Trade" } });
  const itCategory = await prisma.businessMainCategory.findFirstOrThrow({
    where: { name: "Information Technology & Software Services" },
  });
  const foodCategory = await prisma.businessMainCategory.findFirstOrThrow({
    where: { name: "Hospitality & Tourism" },
  });

  const retailSub = await prisma.businessSubCategory.findMany({ where: { mainCategoryId: retailCategory.id }, take: 2 });
  const itSub = await prisma.businessSubCategory.findMany({ where: { mainCategoryId: itCategory.id }, take: 2 });
  const foodSub = await prisma.businessSubCategory.findMany({ where: { mainCategoryId: foodCategory.id }, take: 2 });

  const passwordHash = await bcrypt.hash("DemoOwner123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "demo.owner@example.com" },
    update: {},
    create: { email: "demo.owner@example.com", name: "Demo Owner", passwordHash },
  });

  const businesses = [
    {
      businessName: "Kadiya Fresh Market",
      ownerName: "Ramesh Kadiya",
      establishedYear: 2010,
      businessPhone: "+91 98765 43210",
      personalPhone: "+91 98765 43211",
      email: "contact@kadiyafresh.example.com",
      website: "https://kadiyafresh.example.com",
      entityId: entities[0]?.id ?? proprietorship.id,
      typeId: types[0]?.id,
      mainCategoryId: retailCategory.id,
      subCategoryIds: retailSub.map((s) => s.id),
      city: surat?.name ?? "Surat",
      area: "Varachha",
      about: "Family-run grocery store stocking fresh local produce and everyday essentials for the community.",
      productsServices: "Fresh vegetables, fruits, groceries, home delivery within 5km.",
      experience: "15 years serving the local Kadiya community.",
      socialLinks: "https://instagram.com/kadiyafresh",
      brochureUrl: "https://example.com/brochures/kadiya-fresh-market.pdf",
      status: "APPROVED" as const,
    },
    {
      businessName: "Kadiya Softworks",
      ownerName: "Priya Kadiya",
      establishedYear: 2018,
      businessPhone: "+91 91234 56780",
      personalPhone: null,
      email: "hello@kadiyasoftworks.example.com",
      website: "https://kadiyasoftworks.example.com",
      entityId: entities[1]?.id ?? proprietorship.id,
      typeId: types[1]?.id ?? types[0]?.id,
      mainCategoryId: itCategory.id,
      subCategoryIds: itSub.map((s) => s.id),
      city: rajkot?.name ?? "Rajkot",
      area: "Kalawad Road",
      about: "Custom software development and IT consulting for small and medium businesses.",
      productsServices: "Web apps, mobile apps, IT support contracts.",
      experience: "7 years building software for regional businesses.",
      socialLinks: "https://linkedin.com/company/kadiyasoftworks, https://twitter.com/kadiyasoftworks",
      brochureUrl: null,
      status: "APPROVED" as const,
    },
    {
      businessName: "Kadiya Sweets & Snacks",
      ownerName: "Manoj Kadiya",
      establishedYear: 2005,
      businessPhone: "+91 90000 11122",
      personalPhone: "+91 90000 11123",
      email: null,
      website: null,
      entityId: proprietorship.id,
      typeId: types[0]?.id,
      mainCategoryId: foodCategory.id,
      subCategoryIds: foodSub.map((s) => s.id),
      city: vadodara?.name ?? "Vadodara",
      area: "Alkapuri",
      about: "Traditional Gujarati sweets and snacks made fresh daily using family recipes.",
      productsServices: "Sweets, farsan, festival gift boxes, catering for events.",
      experience: "Three generations in the sweets business.",
      socialLinks: null,
      brochureUrl: "https://example.com/brochures/kadiya-sweets.pdf",
      status: "APPROVED" as const,
    },
    {
      businessName: "Kadiya Logistics",
      ownerName: "Suresh Kadiya",
      establishedYear: 2015,
      businessPhone: "+91 99887 76655",
      personalPhone: null,
      email: "ops@kadiyalogistics.example.com",
      website: null,
      entityId: proprietorship.id,
      typeId: types[0]?.id,
      mainCategoryId: retailCategory.id,
      subCategoryIds: retailSub.map((s) => s.id).slice(0, 1),
      city: surat?.name ?? "Surat",
      area: "Katargam",
      about: "Regional freight and logistics services connecting Gujarat's business hubs.",
      productsServices: "Freight transport, warehousing, last-mile delivery.",
      experience: "9 years in regional logistics.",
      socialLinks: null,
      brochureUrl: null,
      status: "APPROVED" as const,
    },
    {
      businessName: "Kadiya Pending Traders",
      ownerName: "Not Yet Approved",
      establishedYear: 2023,
      businessPhone: "+91 90909 09090",
      personalPhone: null,
      email: null,
      website: null,
      entityId: proprietorship.id,
      typeId: types[0]?.id,
      mainCategoryId: retailCategory.id,
      subCategoryIds: retailSub.map((s) => s.id).slice(0, 1),
      city: surat?.name ?? "Surat",
      area: "Adajan",
      about: "This listing is still awaiting admin approval and must never appear on public pages.",
      productsServices: "N/A",
      experience: null,
      socialLinks: null,
      brochureUrl: null,
      status: "PENDING" as const,
    },
  ];

  for (const b of businesses) {
    const { subCategoryIds, ...data } = b;

    const existing = await prisma.business.findFirst({ where: { businessName: data.businessName } });
    if (existing) {
      console.log(`Skipping "${data.businessName}" — already exists (${existing.id}).`);
      continue;
    }

    const business = await prisma.business.create({
      data: {
        ...data,
        slug: slugify(data.businessName),
        submittedById: owner.id,
        countryId: india.id,
        stateId: gujarat.id,
        approvedAt: data.status === "APPROVED" ? new Date() : null,
        subCategories: {
          create: subCategoryIds.map((subCategoryId) => ({ subCategoryId })),
        },
      },
    });

    console.log(`Created "${business.businessName}" (${business.status}) -> ${business.id}`);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
