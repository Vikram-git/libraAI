import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { books, categories, coverFromIsbn, priceInrForCategory } from "./books-data.js";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "admin@libraai.com" },
    update: {},
    create: {
      email: "admin@libraai.com",
      passwordHash,
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "librarian@libraai.com" },
    update: {},
    create: {
      email: "librarian@libraai.com",
      passwordHash,
      name: "Librarian",
      role: Role.LIBRARIAN,
    },
  });

  await prisma.user.upsert({
    where: { email: "member@libraai.com" },
    update: {},
    create: {
      email: "member@libraai.com",
      passwordHash,
      name: "Demo Member",
      role: Role.MEMBER,
      readingGoal: 12,
    },
  });

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }

  const catMap = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );

  for (const b of books) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {
        title: b.title,
        author: b.author,
        description: b.description,
        coverUrl: coverFromIsbn(b.isbn),
        priceInr: priceInrForCategory(b.categorySlug, b.title),
        publishedYear: b.publishedYear,
        categoryId: catMap[b.categorySlug],
      },
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        description: b.description,
        coverUrl: coverFromIsbn(b.isbn),
        priceInr: priceInrForCategory(b.categorySlug, b.title),
        publishedYear: b.publishedYear,
        totalCopies: 5,
        available: 5,
        categoryId: catMap[b.categorySlug],
      },
    });
  }

  // Sample borrows for collaborative filtering demos
  const member = await prisma.user.findUnique({ where: { email: "member@libraai.com" } });
  const sampleBooks = await prisma.book.findMany({ take: 3 });
  if (member && sampleBooks.length >= 2) {
    const existing = await prisma.borrow.count({ where: { userId: member.id } });
    if (existing === 0) {
      const due = new Date();
      due.setDate(due.getDate() + 10);
      await prisma.borrow.create({
        data: {
          userId: member.id,
          bookId: sampleBooks[0].id,
          dueDate: due,
        },
      });
      await prisma.book.update({
        where: { id: sampleBooks[0].id },
        data: { available: { decrement: 1 } },
      });
    }
  }

  console.log(`Seed complete: ${books.length} books with cover images.`);
  console.log("Logins: admin@libraai.com | librarian@libraai.com | member@libraai.com — password: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
