import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        try {
          await this.$connect();
          this.logger.log('Prisma successfully connected to the database.');
        } catch (error) {
          this.logger.error('Failed to connect to the database', error);
          throw new Error('Could not connect to the database');
        }
      }
      async onModuleDestroy() {
        try {
          await this.$disconnect();
          this.logger.log('Prisma connection successfully closed.');
        } catch (error) {
          this.logger.error('Error closing Prisma connection', error);
        }
      }
}
