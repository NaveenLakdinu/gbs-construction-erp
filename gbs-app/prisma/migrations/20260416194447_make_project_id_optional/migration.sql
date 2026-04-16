-- DropForeignKey
ALTER TABLE "workers" DROP CONSTRAINT "workers_project_id_fkey";

-- AlterTable
ALTER TABLE "workers" ALTER COLUMN "project_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
