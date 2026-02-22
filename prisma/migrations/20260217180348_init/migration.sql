-- AlterTable
ALTER TABLE `file` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `File_isPublic_deletedAt_idx` ON `File`(`isPublic`, `deletedAt`);
