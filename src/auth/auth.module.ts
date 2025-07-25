import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma-setup/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { envs } from '../config';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma-setup/prisma.service';
import { MailService } from '../mail/mail.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    ConfigModule,
    PassportModule.register({
      defaultStrategy: 'jwt'}),

      JwtModule.register({
        global: true,
        secret: envs.jwtSecret,
        signOptions: {expiresIn: '12h'},
      }),
    ],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService, MailService],
  exports: [AuthService],
})
export class AuthModule {}
