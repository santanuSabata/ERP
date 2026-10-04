import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory explicitly
dotenv.config({ path: path.join(__dirname, ".env") });

const { Pool, types } = pkg;

// Return DATE columns as plain strings
types.setTypeParser(1082, (val) => val);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL is undefined! Check your .env file location.");
    process.exit(1);
}

// Check if connection is local or has SSL explicitly disabled
const isLocal = connectionString.includes("localhost") || 
                connectionString.includes("127.0.0.1") || 
                connectionString.includes("sslmode=disable");

const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

pool.on("connect", () => {
    if (isLocal) {
        console.log("Connected to Local PostgreSQL");
    } else {
        console.log("Connected to Neon Postgres");
    }
});

pool.on("error", (err) => {
    console.error("Unexpected Postgres error:", err);
    process.exit(-1);
});

export default pool;