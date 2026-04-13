/*
  Warnings:

  - You are about to drop the column `daily_wage` on the `workers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nic]` on the table `workers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `daily_rate` to the `workers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nic` to the `workers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `workers` table without a default value. This is not possible if the table is not empty.
  - Made the column `project_id` on table `workers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "workers" DROP CONSTRAINT "workers_project_id_fkey";

-- AlterTable
ALTER TABLE "workers" DROP COLUMN "daily_wage",
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "daily_rate" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "nic" VARCHAR(20) NOT NULL,
ADD COLUMN     "phone" VARCHAR(20) NOT NULL,
ALTER COLUMN "project_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "workers_nic_key" ON "workers"("nic");

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
