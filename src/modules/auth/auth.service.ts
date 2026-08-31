import { userRepository, UserRepository } from '../users/users.repository';
import { ForgotPasswordInput, LoginInput, ResetPasswordInput, SignupInput } from './auth.validation';
import { createHash, randomBytes } from 'node:crypto';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../utils/appError';
import { signToken } from '../../utils/jwt';
import { MESSAGES } from '../../constants/messages';
import { IUser } from '../users/users.model';

export interface AuthResult {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  token: string;
  message: string;
}

export class AuthService {
  constructor(private userRepo: UserRepository = userRepository) {}

  async signup(input: SignupInput): Promise<AuthResult> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    const user = await this.userRepo.create({
      username: input.username,
      email: input.email,
      password: input.password,
      role: 'user',
    });

    const token = this.generateUserToken(user);

    return {
      user: {
        id: user.id || (user._id as any).toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
      message: MESSAGES.AUTH.SIGNUP_SUCCESS,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(input.email, true);
    if (!user) {
      throw new UnauthorizedError(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const token = this.generateUserToken(user);

    return {
      user: {
        id: user.id || (user._id as any).toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return user;
  }

  async requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.userRepo.setPasswordResetToken(user.id || user._id.toString(), tokenHash, new Date(Date.now() + 15 * 60 * 1000));
    if (process.env.NODE_ENV !== 'production') {
      console.info(`Password reset URL: http://localhost:4200/reset-password/${token}`);
    }
  }

  async resetPassword(token: string, input: ResetPasswordInput): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.userRepo.findByPasswordResetToken(tokenHash);
    if (!user) throw new UnauthorizedError('Reset token is invalid or expired');
    await this.userRepo.updatePassword(user.id || user._id.toString(), input.password);
  }

  private generateUserToken(user: IUser): string {
    const userId = user.id || (user._id as any).toString();
    return signToken({
      userId,
      email: user.email,
      username: user.username,
      role: user.role,
    });
  }
}

export const authService = new AuthService();
