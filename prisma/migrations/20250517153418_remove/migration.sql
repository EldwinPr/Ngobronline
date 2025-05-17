/*
  Warnings:

  - The values [READ] on the enum `MessageStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `PublicKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MessageStatus_new" AS ENUM ('PENDING', 'DELIVERED');
ALTER TABLE "Message" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "status" TYPE "MessageStatus_new" USING ("status"::text::"MessageStatus_new");
ALTER TYPE "MessageStatus" RENAME TO "MessageStatus_old";
ALTER TYPE "MessageStatus_new" RENAME TO "MessageStatus";
DROP TYPE "MessageStatus_old";
ALTER TABLE "Message" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "PublicKey" DROP CONSTRAINT "PublicKey_userId_fkey";

-- DropTable
DROP TABLE "PublicKey";
