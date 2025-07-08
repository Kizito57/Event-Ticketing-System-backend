import type {Config} from 'jest';

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  coveragePathIgnorePatterns: [
  "/node_modules/",
  "src/Drizzle.db.ts",
  "src/Drizzle/schema.ts",
]
};


export default config;