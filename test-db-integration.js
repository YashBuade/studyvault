#!/usr/bin/env node

/**
 * Database Integration Test Script
 * Tests Prisma connectivity and basic CRUD operations
 */

import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("🧪 Starting Database Integration Tests...\n");

  try {
    // Test 1: Database Connection
    console.log("Test 1: Database Connection");
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection successful\n");

    // Test 2: User Operations
    console.log("Test 2: User CRUD Operations");
    
    // Clean up test user if exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "test-integration@example.com" },
    });
    if (existingUser) {
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: "Test Integration User",
        email: "test-integration@example.com",
        passwordHash: "hashed_password_here",
      },
    });
    console.log(`  ✓ Created user: ${user.email} (ID: ${user.id})`);

    // Read user
    const foundUser = await prisma.user.findUnique({
      where: { email: "test-integration@example.com" },
    });
    console.log(`  ✓ Found user: ${foundUser?.name}`);

    // Update user
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { onboardingSeen: true },
    });
    console.log(`  ✓ Updated user: onboardingSeen = ${updated.onboardingSeen}`);

    // Test 3: Note Operations
    console.log("\nTest 3: Note CRUD Operations");

    const note = await prisma.note.create({
      data: {
        title: "Integration Test Note",
        content: "This is a test note to verify database integration",
        subject: "Testing",
        userId: user.id,
        isPublic: true,
      },
    });
    console.log(`  ✓ Created note: "${note.title}" (ID: ${note.id})`);

    const notes = await prisma.note.findMany({
      where: { userId: user.id },
    });
    console.log(`  ✓ Found ${notes.length} note(s) for user`);

    const noteUpdate = await prisma.note.update({
      where: { id: note.id },
      data: { content: "Updated test content" },
    });
    console.log(`  ✓ Updated note: content length = ${noteUpdate.content.length}`);

    // Test 4: File Operations
    console.log("\nTest 4: File CRUD Operations");

    const file = await prisma.file.create({
      data: {
        originalName: "test-file.pdf",
        storedName: "test-file-12345.pdf",
        path: "/uploads/u-1/test-file-12345.pdf",
        mimeType: "application/pdf",
        size: 1024000,
        userId: user.id,
        isPublic: false,
      },
    });
    console.log(`  ✓ Created file: ${file.originalName} (${file.size} bytes)`);

    const files = await prisma.file.findMany({
      where: { userId: user.id },
    });
    console.log(`  ✓ Found ${files.length} file(s) for user`);

    // Test 5: Relations
    console.log("\nTest 5: Relationship Operations");

    const noteWithUser = await prisma.note.findUnique({
      where: { id: note.id },
      include: { user: true },
    });
    console.log(`  ✓ Retrieved note with user: ${noteWithUser?.user.name}`);

    // Test 6: Cleanup
    console.log("\nTest 6: Cleanup Operations");

    await prisma.noteAttachment.deleteMany({
      where: { noteId: note.id },
    });
    console.log("  ✓ Deleted note attachments");

    await prisma.note.delete({
      where: { id: note.id },
    });
    console.log("  ✓ Deleted test note");

    await prisma.file.delete({
      where: { id: file.id },
    });
    console.log("  ✓ Deleted test file");

    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log("  ✓ Deleted test user");

    console.log("\n✅ All tests passed! Database integration is working correctly.\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

