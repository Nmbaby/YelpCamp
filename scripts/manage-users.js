/*
 * User Management Script
 * This script helps you manage users in your database
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");
const readline = require("readline");

// Use the same DB connection logic as app.js
function getDbUrl() {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && process.env.USE_LOCAL_DB !== "false") {
    return "mongodb://127.0.0.1:27017/yelp-camp";
  }
  if (process.env.DB_URL) {
    return process.env.DB_URL.trim();
  }
  if (process.env.DB_USER && process.env.DB_PASS && process.env.DB_HOST) {
    const user = encodeURIComponent(process.env.DB_USER);
    const pass = encodeURIComponent(process.env.DB_PASS);
    const host = process.env.DB_HOST;
    const dbName = process.env.DB_NAME || "yelp-camp";
    return `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;
  }
  return "mongodb://127.0.0.1:27017/yelp-camp";
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function listUsers() {
  const users = await User.find({}).select("email username createdAt");

  if (users.length === 0) {
    console.log("\n📋 No users found in database.");
    return;
  }

  console.log("\n📋 Users in database:");
  console.log("━".repeat(70));
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}`);
    console.log(`   Username: ${user.username || "N/A"}`);
    console.log(
      `   Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : "N/A"}`,
    );
    console.log("─".repeat(70));
  });
}

async function createTestUser() {
  console.log("\n🆕 Create a new test user");
  console.log("━".repeat(70));

  const email = await question("Enter email (default: test@test.com): ");
  const password = await question("Enter password (default: test123): ");

  const userEmail = email.trim() || "test@test.com";
  const userPassword = password.trim() || "test123";

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      console.log(`\n❌ User with email ${userEmail} already exists!`);
      const overwrite = await question("Delete and recreate? (yes/no): ");
      if (
        overwrite.toLowerCase() === "yes" ||
        overwrite.toLowerCase() === "y"
      ) {
        await User.deleteOne({ email: userEmail });
        console.log("✓ Deleted existing user");
      } else {
        console.log("Cancelled.");
        return;
      }
    }

    const user = new User({ email: userEmail });
    await User.register(user, userPassword);

    console.log("\n✅ User created successfully!");
    console.log("━".repeat(70));
    console.log(`📧 Email: ${userEmail}`);
    console.log(`🔑 Password: ${userPassword}`);
    console.log(`👤 Username: ${user.username}`);
    console.log("━".repeat(70));
    console.log("\nYou can now login with these credentials!");
  } catch (err) {
    console.error("\n❌ Error creating user:", err.message);
  }
}

async function deleteUser() {
  await listUsers();
  console.log("\n🗑️  Delete a user");
  const email = await question("\nEnter email of user to delete: ");

  if (!email.trim()) {
    console.log("No email provided. Cancelled.");
    return;
  }

  const user = await User.findOne({ email: email.trim() });
  if (!user) {
    console.log(`\n❌ No user found with email: ${email}`);
    return;
  }

  const confirm = await question(`Delete user ${email}? (yes/no): `);
  if (confirm.toLowerCase() === "yes" || confirm.toLowerCase() === "y") {
    await User.deleteOne({ email: email.trim() });
    console.log("✅ User deleted successfully!");
  } else {
    console.log("Cancelled.");
  }
}

async function resetPassword() {
  await listUsers();
  console.log("\n🔑 Reset user password");
  const email = await question("\nEnter email: ");
  const newPassword = await question("Enter new password: ");

  if (!email.trim() || !newPassword.trim()) {
    console.log("Email and password required. Cancelled.");
    return;
  }

  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      console.log(`\n❌ No user found with email: ${email}`);
      return;
    }

    await user.setPassword(newPassword.trim());
    await user.save();

    console.log("\n✅ Password reset successfully!");
    console.log("━".repeat(70));
    console.log(`📧 Email: ${email.trim()}`);
    console.log(`🔑 New Password: ${newPassword.trim()}`);
    console.log("━".repeat(70));
  } catch (err) {
    console.error("\n❌ Error resetting password:", err.message);
  }
}

async function showMenu() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║     YelpCamp User Management          ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log("\n1. List all users");
  console.log("2. Create new test user");
  console.log("3. Delete user");
  console.log("4. Reset password");
  console.log("5. Exit");
  console.log("");

  const choice = await question("Choose an option (1-5): ");

  switch (choice.trim()) {
    case "1":
      await listUsers();
      await showMenu();
      break;
    case "2":
      await createTestUser();
      await showMenu();
      break;
    case "3":
      await deleteUser();
      await showMenu();
      break;
    case "4":
      await resetPassword();
      await showMenu();
      break;
    case "5":
      console.log("\n👋 Goodbye!");
      rl.close();
      process.exit(0);
      break;
    default:
      console.log("Invalid option. Please choose 1-5.");
      await showMenu();
  }
}

async function main() {
  try {
    const dbUrl = getDbUrl();
    console.log("\n🔌 Connecting to database...");
    await mongoose.connect(dbUrl, { family: 4 });
    console.log("✅ Connected to database\n");

    await showMenu();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n👋 Shutting down...");
  await mongoose.connection.close();
  rl.close();
  process.exit(0);
});

main();
