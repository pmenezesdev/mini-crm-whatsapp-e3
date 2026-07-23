import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const seedUser1Email = process.env.SEED_USER_1_EMAIL;
  const seedUser2Email = process.env.SEED_USER_2_EMAIL;

  if (!seedUser1Email || !seedUser2Email) {
    throw new Error(
      "Defina SEED_USER_1_EMAIL e SEED_USER_2_EMAIL no .env com os emails Google que serao usados para login (uma unidade cada)."
    );
  }

  const unitCentro = await prisma.unit.upsert({
    where: { id: "unit-centro" },
    update: {},
    create: {
      id: "unit-centro",
      name: "Unidade Centro",
      isWhatsappOwner: true,
    },
  });

  const unitZonaSul = await prisma.unit.upsert({
    where: { id: "unit-zona-sul" },
    update: {},
    create: {
      id: "unit-zona-sul",
      name: "Unidade Zona Sul",
      isWhatsappOwner: false,
    },
  });

  await prisma.user.upsert({
    where: { email: seedUser1Email },
    update: { unitId: unitCentro.id },
    create: {
      email: seedUser1Email,
      name: "Usuario Unidade Centro",
      unitId: unitCentro.id,
    },
  });

  await prisma.user.upsert({
    where: { email: seedUser2Email },
    update: { unitId: unitZonaSul.id },
    create: {
      email: seedUser2Email,
      name: "Usuario Unidade Zona Sul",
      unitId: unitZonaSul.id,
    },
  });

  console.log("Seed concluido:");
  console.log(`  - ${unitCentro.name} (dona da conexao WhatsApp) -> ${seedUser1Email}`);
  console.log(`  - ${unitZonaSul.name} -> ${seedUser2Email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
