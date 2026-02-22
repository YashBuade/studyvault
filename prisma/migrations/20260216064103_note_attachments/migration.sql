-- AlterTable
ALTER TABLE `noteshare` ADD COLUMN `permission` ENUM('VIEW', 'EDIT') NOT NULL DEFAULT 'VIEW';

-- CreateTable
CREATE TABLE `NoteAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `noteId` INTEGER NOT NULL,
    `fileId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NoteAttachment_noteId_idx`(`noteId`),
    UNIQUE INDEX `NoteAttachment_noteId_fileId_key`(`noteId`, `fileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NoteAttachment` ADD CONSTRAINT `NoteAttachment_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `Note`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NoteAttachment` ADD CONSTRAINT `NoteAttachment_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
