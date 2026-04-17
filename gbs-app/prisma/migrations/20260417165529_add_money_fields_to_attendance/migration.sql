-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "amountEarned" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0;
