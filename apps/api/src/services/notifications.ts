import type { NotificationType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
) {
  return prisma.notification.create({
    data: { userId, type, title, message },
  });
}

/** Check overdue borrows and create reminders (run via cron or admin trigger) */
export async function processDueDateReminders() {
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const upcoming = await prisma.borrow.findMany({
    where: {
      status: "ACTIVE",
      dueDate: { lte: inThreeDays, gte: new Date() },
    },
    include: { book: true, user: true },
  });

  for (const borrow of upcoming) {
    await createNotification(
      borrow.userId,
      "DUE_DATE",
      "Book due soon",
      `"${borrow.book.title}" is due on ${borrow.dueDate.toISOString().slice(0, 10)}.`,
    );
  }

  const overdue = await prisma.borrow.findMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    include: { book: true },
  });

  for (const borrow of overdue) {
    await prisma.borrow.update({
      where: { id: borrow.id },
      data: { status: "OVERDUE" },
    });
    await createNotification(
      borrow.userId,
      "FINE",
      "Overdue book",
      `"${borrow.book.title}" is overdue. Please return it to avoid fines.`,
    );
  }

  return { reminders: upcoming.length, overdue: overdue.length };
}
