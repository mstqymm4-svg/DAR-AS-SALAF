// Tests run against a throwaway database. Set TEST_DATABASE_URL to override.
// It must never point at staging or production data.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgresql://dau:dau_local_only@localhost:5432/dar_al_uloom_test";
process.env.JWT_ACCESS_SECRET ||= "test_access_secret_test_access_secret_123";
process.env.JWT_REFRESH_SECRET ||= "test_refresh_secret_test_refresh_secret_456";
process.env.UPLOAD_DIR = require("path").resolve(__dirname, "../.test-uploads");
