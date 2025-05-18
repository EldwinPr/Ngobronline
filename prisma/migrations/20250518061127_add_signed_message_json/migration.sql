/*
  Warnings:

  - Added the required column `signedMessageJson` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "signedMessageJson" TEXT NOT NULL;
