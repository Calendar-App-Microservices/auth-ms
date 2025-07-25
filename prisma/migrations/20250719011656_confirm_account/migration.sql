/*
  Warnings:

  - The values [USER,ADMIN,SUPERUSER,PROFESSIONAL] on the enum `Roles` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `ResetToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Roles_new" AS ENUM ('user', 'admin', 'superuser', 'professional');
ALTER TABLE "Users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Users" ALTER COLUMN "role" TYPE "Roles_new" USING ("role"::text::"Roles_new");
ALTER TYPE "Roles" RENAME TO "Roles_old";
ALTER TYPE "Roles_new" RENAME TO "Roles";
DROP TYPE "Roles_old";
ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;

-- DropForeignKey
ALTER TABLE "ResetToken" DROP CONSTRAINT "ResetToken_userId_fkey";

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'user';

-- DropTable
DROP TABLE "ResetToken";
