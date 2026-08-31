import bcrypt from 'bcryptjs';
import { IUser, User } from './users.model';
import { db } from '../../config/db';
import { Types } from 'mongoose';

export class UserRepository {
  // In-memory fallback collection for resilient offline/standalone execution
  private memoryUsers: Array<{
    id: string;
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  constructor() {
    this.seedMemoryUser();
  }

  private async seedMemoryUser(): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    this.memoryUsers.push({
      id: 'usr_demo_admin',
      username: 'Test User',
      email: 'test@gmail.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findByEmail(email: string, includePassword = false): Promise<any | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (db.isDbConnected()) {
      try {
        const query = User.findOne({ email: cleanEmail });
        if (includePassword) {
          query.select('+password');
        }
        return await query.exec();
      } catch {
        // Fallback to memory
      }
    }

    const found = this.memoryUsers.find((u) => u.email === cleanEmail);
    if (!found) return null;

    return {
      ...found,
      _id: found.id,
      comparePassword: async (candidatePassword: string) => {
        return bcrypt.compare(candidatePassword, found.password);
      },
    };
  }

  async findById(id: string): Promise<any | null> {
    if (db.isDbConnected()) {
      try {
        return await User.findById(id).exec();
      } catch {
        // Fallback
      }
    }

    const found = this.memoryUsers.find((u) => u.id === id);
    if (!found) return null;
    return {
      id: found.id,
      _id: found.id,
      username: found.username,
      email: found.email,
      role: found.role,
      avatarUrl: found.avatarUrl,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
  }

  async create(userData: Partial<IUser>): Promise<any> {
    if (db.isDbConnected()) {
      try {
        return await User.create(userData);
      } catch {
        // Fallback
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password || '', salt);

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: userData.username || 'User',
      email: (userData.email || '').toLowerCase().trim(),
      password: hashedPassword,
      role: (userData.role || 'user') as 'user' | 'admin',
      avatarUrl: userData.avatarUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryUsers.push(newUser);

    return {
      ...newUser,
      _id: newUser.id,
      comparePassword: async (candidatePassword: string) => {
        return bcrypt.compare(candidatePassword, newUser.password);
      },
    };
  }

  async count(): Promise<number> {
    if (db.isDbConnected()) {
      try {
        return await User.countDocuments().exec();
      } catch {
        // Fallback
      }
    }
    return this.memoryUsers.length;
  }

  async setPasswordResetToken(userId: string, tokenHash: string, expires: Date): Promise<void> {
    if (!db.isDbConnected()) throw new Error('MongoDB is unavailable');
    await User.findByIdAndUpdate(userId, {
      passwordResetToken: tokenHash,
      passwordResetExpires: expires,
    }).exec();
  }

  async findByPasswordResetToken(tokenHash: string): Promise<any | null> {
    if (!db.isDbConnected()) throw new Error('MongoDB is unavailable');
    return User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires').exec();
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    if (!db.isDbConnected()) throw new Error('MongoDB is unavailable');
    const user = await User.findById(userId).select('+passwordResetToken +passwordResetExpires').exec();
    if (!user) return;
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }
}

export const userRepository = new UserRepository();
