// test/setup.ts
import "pg"; // Ensure pg is loaded for TypeORM
import { execSync } from "child_process";

process.env.NODE_ENV = "test";

// Ensure test database exists before running tests
try {
  execSync(
    'docker exec -i user-registration-db psql -U postgres -d postgres -c "CREATE DATABASE user_registration_test;"',
    {
      stdio: "pipe", // Suppress output unless there's an error
    }
  );
  console.log("Test database created or already exists");
} catch (error: any) {
  // Ignore error if database already exists (exit code 1 with "already exists" message)
  if (!error.stderr?.includes("already exists")) {
    console.error("Failed to create test database:", error.message);
    throw error;
  }
  console.log("Test database already exists");
}
