-- DropIndex
DROP INDEX "users_available_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "createdBy" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
