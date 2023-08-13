-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "op" VARCHAR(30) NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

