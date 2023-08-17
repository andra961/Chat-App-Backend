/*
  Warnings:

  - You are about to drop the column `token` on the `WsTicket` table. All the data in the column will be lost.
  - Added the required column `ticket` to the `WsTicket` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "WsTicket_token_key";

-- AlterTable
ALTER TABLE "WsTicket" DROP COLUMN "token",
ADD COLUMN     "ticket" VARCHAR(64) NOT NULL;
