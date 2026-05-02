import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.lead.createMany({
    data: [
      {
        name: 'דנה לוי',
        phone: '054-1234567',
        email: 'dana@example.com',
        service: 'צילום חתונה',
        message: 'מחפשת צלם לחתונה בחודש יוני',
        status: 'חדש',
        notes: '',
      },
      {
        name: 'יוסי כהן',
        phone: '052-9876543',
        email: 'yossi@example.com',
        service: 'וידאו תדמית',
        message: 'צריך סרטון תדמית לעסק חדש',
        status: 'בטיפול',
        notes: 'שיחה מתוכננת ליום חמישי',
      },
      {
        name: 'מיכל אברהם',
        phone: '050-5554433',
        email: 'michal@example.com',
        service: 'צילום אירוע',
        message: 'בת מצווה לבת שלי בחודש הבא',
        status: 'סגור',
        notes: 'עסקה נסגרה, מחיר הוסכם',
      },
    ],
  });
  console.log('Seed complete — 3 leads added');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
