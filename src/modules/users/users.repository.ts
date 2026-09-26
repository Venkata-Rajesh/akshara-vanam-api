import { IUser, User } from "./users.model";
import { db } from "../../config/db";
import { AppError } from "../../utils/appError";
import { HTTP_STATUS } from "../../constants/httpStatusCodes";

export class UserRepository {
  private requireDatabase(): void {
    if (!db.isDbConnected()) {
      throw new AppError(
        "MongoDB is unavailable. User data was not persisted.",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<any | null> {
    const cleanEmail = email.toLowerCase().trim();
    this.requireDatabase();
    const query = User.findOne({ email: cleanEmail });
    if (includePassword) {
      query.select("+password");
    }
    return query.exec();
  }

  async findById(id: string): Promise<any | null> {
    this.requireDatabase();
    return User.findById(id).exec();
  }

  async create(userData: Partial<IUser>): Promise<any> {
    this.requireDatabase();
    return User.create(userData);
  }

  async count(): Promise<number> {
    this.requireDatabase();
    return User.countDocuments().exec();
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expires: Date,
  ): Promise<void> {
    this.requireDatabase();
    await User.findByIdAndUpdate(userId, {
      passwordResetToken: tokenHash,
      passwordResetExpires: expires,
    }).exec();
  }

  async findByPasswordResetToken(tokenHash: string): Promise<any | null> {
    this.requireDatabase();
    return User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    })
      .select("+passwordResetToken +passwordResetExpires")
      .exec();
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    this.requireDatabase();
    const user = await User.findById(userId)
      .select("+passwordResetToken +passwordResetExpires")
      .exec();
    if (!user) return;
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }
}

export const userRepository = new UserRepository();
