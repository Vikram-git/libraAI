import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleItems = [
  { name: "Wireless Mouse", description: "Ergonomic wireless mouse", price: 29.99, quantity: 50, category: "electronics" },
  { name: "USB-C Hub", description: "7-in-1 USB-C adapter", price: 45.0, quantity: 30, category: "electronics" },
  { name: "Notebook A5", description: "Ruled 200-page notebook", price: 4.5, quantity: 200, category: "stationery" },
  { name: "Desk Lamp", description: "LED adjustable desk lamp", price: 35.0, quantity: 25, category: "furniture" },
  { name: "Python Programming Book", description: "Learn Python 3", price: 39.99, quantity: 15, category: "books" },
  { name: "Coffee Mug", description: "Ceramic 350ml mug", price: 12.0, quantity: 80, category: "kitchen" },
  { name: "Bluetooth Speaker", description: "Portable waterproof speaker", price: 59.99, quantity: 20, category: "electronics" },
  { name: "Whiteboard Marker Set", description: "Pack of 4 colors", price: 8.99, quantity: 100, category: "stationery" },
];

async function main() {
  const count = await prisma.item.count();
  if (count > 0) {
    console.log(`Items already seeded (${count} items). Skipping.`);
    return;
  }

  for (const item of sampleItems) {
    await prisma.item.create({ data: item });
  }
  console.log(`Seeded ${sampleItems.length} sample items.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
