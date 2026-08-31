
import { User } from '../modules/users/users.model';
import { Quote } from '../modules/quotes/quotes.model';
import { logger } from '../config/logger';
import { db } from '../config/db';

export const INITIAL_QUOTES = [
  {
    author: 'Steve Jobs',
    content: 'The only way to do great work is to love what you do.',
    tags: ['Inspiration', 'Work', 'Leadership'],
    likesCount: 12,
  },
  {
    author: 'Albert Einstein',
    content: 'Strive not to be a success, but rather to be of value.',
    tags: ['Life', 'Inspiration', 'Wisdom'],
    likesCount: 9,
  },
  {
    author: 'Wayne Gretzky',
    content: 'You miss 100% of the shots you don’t take.',
    tags: ['Action', 'Sports', 'Motivation'],
    likesCount: 15,
  },
  {
    author: 'Peter Drucker',
    content: 'The best way to predict the future is to create it.',
    tags: ['Future', 'Strategy', 'Leadership'],
    likesCount: 8,
  },
  {
    author: 'Maya Angelou',
    content: 'You will face many defeats in life, but never let yourself be defeated.',
    tags: ['Resilience', 'Life', 'Wisdom'],
    likesCount: 14,
  },
  {
    author: 'Eleanor Roosevelt',
    content: 'The future belongs to those who believe in the beauty of their dreams.',
    tags: ['Future', 'Inspiration', 'Dreams'],
    likesCount: 11,
  },
  {
    author: 'Nelson Mandela',
    content: 'It always seems impossible until it is done.',
    tags: ['Action', 'Motivation', 'Resilience'],
    likesCount: 20,
  },
  {
    author: 'Aristotle',
    content: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    tags: ['Wisdom', 'Habits', 'Leadership'],
    likesCount: 17,
  },
  {
    author: 'Alan Kay',
    content: 'The best way to predict the future is to invent it.',
    tags: ['Technology', 'Future', 'Innovation'],
    likesCount: 10,
  },
  {
    author: 'Marcus Aurelius',
    content: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    tags: ['Wisdom', 'Life', 'Resilience'],
    likesCount: 22,
  },
  {
    author: 'Confucius',
    content: 'It does not matter how slowly you go as long as you do not stop.',
    tags: ['Motivation', 'Action', 'Wisdom'],
    likesCount: 18,
  },
  {
    author: 'Walt Disney',
    content: 'The way to get started is to quit talking and begin doing.',
    tags: ['Action', 'Leadership', 'Motivation'],
    likesCount: 16,
  },
];

export const seedDatabase = async (): Promise<void> => {
  if (!db.isDbConnected()) {
    logger.info('ℹ️ Database seeder: running in memory mode (pre-seeded with initial quotes and test user).');
    return;
  }

  try {
    // 1. Seed demo user if no user exists
    let demoUser = await User.findOne({ email: 'test@gmail.com' });

    if (!demoUser) {
      demoUser = await User.create({
        username: 'Test User',
        email: 'test@gmail.com',
        password: 'test123',
        role: 'admin',
      });
      logger.info('✅ Default demo user seeded: test@gmail.com / test123');
    }

    // 2. Seed quotes if collection is empty
    const quoteCount = await Quote.countDocuments();
    if (quoteCount === 0) {
      const quotesToInsert = INITIAL_QUOTES.map((q) => ({
        ...q,
        createdBy: demoUser ? demoUser._id : undefined,
      }));
      await Quote.insertMany(quotesToInsert);
      logger.info(`✅ Seeded ${quotesToInsert.length} initial inspirational quotes into MongoDB.`);
    }
  } catch (error) {
    logger.warn('Could not complete database seeding:', error);
  }
};
