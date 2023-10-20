/*
  Warnings:

  - You are about to drop the column `op` on the `Message` table. All the data in the column will be lost.
  - Added the required column `receiverId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "op",
ADD COLUMN     "receiverId" VARCHAR(30) NOT NULL,
ADD COLUMN     "senderId" VARCHAR(30) NOT NULL;

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" SERIAL NOT NULL,
    "senderId" VARCHAR(30) NOT NULL,
    "chatId" INTEGER NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
