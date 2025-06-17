import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma-setup/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
})
export class AppModule {}
