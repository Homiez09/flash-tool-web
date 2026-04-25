import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create Default Admin
  const adminEmail = "admin@flashtool.pro";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("12345678", 10);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        credits: 999999,
      },
    });
    console.log("✅ Admin account created: admin@flashtool.pro / 12345678");
  }

  // 2. Create Default System Config
  const existingConfig = await prisma.systemConfig.findUnique({
    where: { id: "global" },
  });

  if (!existingConfig) {
    await prisma.systemConfig.create({
      data: {
        id: "global",
        features: {
          flash: true,
          unlock: true,
          frp: true,
          root: true,
          demo: true,
          cache: true,
        },
        prices: {
          flash: 5,
          unlock: 10,
          frp: 20,
          root: 15,
          demo: 30,
          cache: 2,
        },
      },
    });
    console.log("✅ Default system configuration initialized");
  }

  // 3. Seed some Firmware data
  const existingFirmware = await prisma.firmware.findMany();
  if (existingFirmware.length === 0) {
    await prisma.firmware.createMany({
      data: [
        {
          brand: "Xiaomi",
          model: "Redmi Note 13 Pro",
          version: "V14.0.5.0.TNRINXM",
          region: "India",
          size: "4.2 GB",
          type: "Fastboot",
          url: "https://example.com/firmware/redmi_note_13_pro.img",
        },
        {
          brand: "Samsung",
          model: "Galaxy S23 Ultra",
          version: "S918BXXU3AWGJ",
          region: "Global",
          size: "8.1 GB",
          type: "Odin",
          url: "https://example.com/firmware/s23_ultra_odin.tar",
        },
        {
          brand: "Google",
          model: "Pixel 8 Pro",
          version: "14.0.0 (UD1A.230805.019)",
          region: "Global",
          size: "2.5 GB",
          type: "Fastboot",
          url: "https://example.com/firmware/pixel8pro_factory.zip",
        }
      ],
    });
    console.log("✅ Initial firmware data seeded");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
