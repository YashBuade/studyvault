DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TeacherVerificationStatus') THEN
    CREATE TYPE "TeacherVerificationStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FileVerificationStatus') THEN
    CREATE TYPE "FileVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'TEACHER'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'TEACHER';
  END IF;
END
$$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "collegeId" VARCHAR(120),
ADD COLUMN IF NOT EXISTS "department" VARCHAR(120),
ADD COLUMN IF NOT EXISTS "teacherVerificationStatus" "TeacherVerificationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS "teacherReviewNotes" TEXT,
ADD COLUMN IF NOT EXISTS "teacherVerifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "teacherReviewedById" INTEGER;

ALTER TABLE "File"
ADD COLUMN IF NOT EXISTS "verificationStatus" "FileVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT,
ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "verifiedById" INTEGER;

UPDATE "File"
SET "verificationStatus" = 'VERIFIED'
WHERE "verificationStatus" = 'PENDING';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_teacherReviewedById_fkey'
  ) THEN
    ALTER TABLE "User"
    ADD CONSTRAINT "User_teacherReviewedById_fkey"
    FOREIGN KEY ("teacherReviewedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'File_verifiedById_fkey'
  ) THEN
    ALTER TABLE "File"
    ADD CONSTRAINT "File_verifiedById_fkey"
    FOREIGN KEY ("verifiedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "User_role_teacherVerificationStatus_idx" ON "User"("role", "teacherVerificationStatus");
CREATE INDEX IF NOT EXISTS "File_isPublic_verificationStatus_deletedAt_idx" ON "File"("isPublic", "verificationStatus", "deletedAt");
CREATE INDEX IF NOT EXISTS "File_verificationStatus_deletedAt_idx" ON "File"("verificationStatus", "deletedAt");
