/*
  Warnings:

  - A unique constraint covering the columns `[ticket]` on the table `WsTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WsTicket_ticket_key" ON "WsTicket"("ticket");
