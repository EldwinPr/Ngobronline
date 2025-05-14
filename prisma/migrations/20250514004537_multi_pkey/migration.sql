/*
  Warnings:

  - You are about to drop the column `publicKey` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "publicKey";

-- CreateTable
CREATE TABLE "PublicKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PublicKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicKey_userId_idx" ON "PublicKey"("userId");

-- CreateIndex
CREATE INDEX "PublicKey_userId_isActive_idx" ON "PublicKey"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "PublicKey" ADD CONSTRAINT "PublicKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
