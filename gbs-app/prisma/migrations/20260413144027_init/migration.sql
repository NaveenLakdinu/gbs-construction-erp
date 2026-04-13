-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'Ongoing',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "daily_wage" DECIMAL(10,2),
    "project_id" INTEGER,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
