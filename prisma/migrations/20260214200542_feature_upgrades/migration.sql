-- AlterTable
ALTER TABLE `file` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `note` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `onboardingSeen` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `passwordChanged` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `File_userId_deletedAt_idx` ON `File`(`userId`, `deletedAt`);

-- CreateIndex
CREATE INDEX `Note_userId_deletedAt_idx` ON `Note`(`userId`, `deletedAt`);
