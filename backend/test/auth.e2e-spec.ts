import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtStrategy } from '../src/modules/auth/jwt.strategy';
import { DatabaseService } from '../src/database/database.service';
import { EmailService } from '../src/common/email/email.service';
import { AppRole } from '../src/entities/user-role.entity';

interface TestUserRecord {
  id: string;
  email: string;
  encrypted_password: string;
}

interface TestProfileRecord {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
}

interface TestResetTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}

describe('Auth flows (e2e)', () => {
  let app: INestApplication<App>;
  const users: TestUserRecord[] = [];
  const profiles: TestProfileRecord[] = [];
  const roles = new Map<string, AppRole>();
  const resetTokens: TestResetTokenRecord[] = [];
  const sentEmails: Array<{
    to: string;
    subject: string;
    html: string;
    text: string;
  }> = [];

  const databaseServiceMock = {
    findUserByEmail: async (email: string) =>
      users.find((user) => user.email === email) || null,
    createUser: async (userData: Partial<TestUserRecord>) => {
      const user = {
        id: `user-${users.length + 1}`,
        email: userData.email || '',
        encrypted_password: userData.encrypted_password || '',
      };
      users.push(user);
      return user;
    },
    createProfile: async (profileData: TestProfileRecord) => {
      profiles.push(profileData);
      return profileData;
    },
    createUserRole: async ({
      userId,
      role,
    }: {
      userId: string;
      role: AppRole;
    }) => {
      roles.set(userId, role);
      return { userId, role };
    },
    findProfileByUserId: async (userId: string) =>
      profiles.find((profile) => profile.userId === userId) || null,
    getUserRole: async (userId: string) => roles.get(userId),
    findUserById: async (userId: string) =>
      users.find((user) => user.id === userId) || null,
    updateProfile: async (
      userId: string,
      profileData: Partial<TestProfileRecord>,
    ) => {
      const profile = profiles.find((item) => item.userId === userId);
      if (!profile) return null;
      Object.assign(profile, profileData);
      return profile;
    },
    invalidatePasswordResetTokens: async (userId: string) => {
      resetTokens.forEach((token) => {
        if (token.userId === userId && token.usedAt === null) {
          token.usedAt = new Date();
        }
      });
    },
    createPasswordResetToken: async (data: Partial<TestResetTokenRecord>) => {
      const record: TestResetTokenRecord = {
        id: `reset-${resetTokens.length + 1}`,
        userId: data.userId || '',
        token: data.token || '',
        expiresAt: data.expiresAt || new Date(Date.now() + 1000 * 60 * 30),
        usedAt: data.usedAt ?? null,
      };
      resetTokens.push(record);
      return record;
    },
    findValidPasswordResetToken: async (token: string) =>
      resetTokens.find(
        (item) =>
          item.token === token &&
          item.usedAt === null &&
          item.expiresAt.getTime() > Date.now(),
      ) || null,
    markPasswordResetTokenUsed: async (id: string) => {
      const token = resetTokens.find((item) => item.id === id);
      if (token) token.usedAt = new Date();
    },
    updateUser: async (id: string, payload: Partial<TestUserRecord>) => {
      const user = users.find((item) => item.id === id) || null;
      if (!user) return null;
      Object.assign(user, payload);
      return user;
    },
  };

  const emailServiceMock = {
    sendWelcomeEmail: async (to: string) => {
      sentEmails.push({ to, subject: 'welcome', html: '', text: '' });
      return { delivered: true };
    },
    sendPasswordResetEmail: async (to: string, resetLink: string) => {
      sentEmails.push({
        to,
        subject: 'reset',
        html: resetLink,
        text: resetLink,
      });
      return { delivered: true };
    },
  };

  beforeEach(async () => {
    users.length = 0;
    profiles.length = 0;
    resetTokens.length = 0;
    roles.clear();
    sentEmails.length = 0;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        {
          provide: DatabaseService,
          useValue: databaseServiceMock,
        },
        {
          provide: EmailService,
          useValue: emailServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'FRONTEND_URL') return 'http://localhost:8080';
              return fallback;
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('signs up, signs in, protects profile, sends reset email and resets password', async () => {
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'client@example.com',
        password: 'secret123',
        fullName: 'Client Demo',
      })
      .expect(201);

    expect(signupResponse.body.access_token).toBeDefined();
    expect(signupResponse.body.user.email).toBe('client@example.com');
    expect(sentEmails.some((email) => email.subject === 'welcome')).toBe(true);

    await request(app.getHttpServer()).get('/auth/profile').expect(401);

    const signinResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'client@example.com',
        password: 'secret123',
      })
      .expect(201);

    const token = signinResponse.body.access_token as string;
    expect(token).toBeDefined();

    const profileResponse = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileResponse.body.email).toBe('client@example.com');
    expect(profileResponse.body.profile.fullName).toBe('Client Demo');

    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'client@example.com' })
      .expect(200);

    expect(sentEmails.some((email) => email.subject === 'reset')).toBe(true);
    const issuedToken = resetTokens[resetTokens.length - 1]?.token;
    expect(issuedToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: issuedToken, password: 'newpass123' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'client@example.com',
        password: 'newpass123',
      })
      .expect(201);
  });

  it('rejects invalid signup payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'bad-email',
        password: '123',
        fullName: '',
      })
      .expect(400);
  });
});
