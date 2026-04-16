-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "note" VARCHAR(500),
ADD COLUMN     "workType" VARCHAR(20) NOT NULL DEFAULT 'Full';

-- CreateTable
CREATE TABLE "workerTransaction" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workerTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "workerTransaction" ADD CONSTRAINT "workerTransaction_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workerTransaction" ADD CONSTRAINT "workerTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
