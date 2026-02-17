import fs from "node:fs";
import path from "node:path";

// Type-safe import of package.json
import pkgContent from "../../package.json" with { type: "json" };
const pkg = pkgContent as PackageJson;

/**
 * Interface for package.json structure (type-safe imports)
 */
interface PackageJson {
  name: string;
  version: string;
  // Additional fields can be added as needed
}

export class ZettelkastenConfig {
  // Storage configuration
  notesDir: string;

  // Database configuration
  databasePath: string;

  // Server configuration
  serverName: string;
  serverVersion: string;

  // Date format for ID generation (using ISO format for timestamps)
  idDateFormat: string;

  // Default note template
  defaultNoteTemplate: string;

  // Logging configuration
  logLevel: string;

  constructor() {
    // Load from environment variables
    this.notesDir = process.env.ZETTELKASTEN_NOTES_DIR || "data/notes";
    this.databasePath =
      process.env.ZETTELKASTEN_DATABASE_PATH || "data/db/zettelkasten.db";
    // Read server name and version from package.json
    this.serverName = pkg.name;
    this.serverVersion = pkg.version;
    this.idDateFormat = "%Y%m%dT%H%M%S";
    this.logLevel = process.env.ZETTELKASTEN_LOG_LEVEL || "INFO";

    this.defaultNoteTemplate =
      "# {title}\n\n" +
      "## Metadata\n" +
      "- Created: {created_at}\n" +
      "- Tags: {tags}\n\n" +
      "## Content\n\n" +
      "{content}\n\n" +
      "## Links\n" +
      "{links}\n";
  }

  /**
   * Convert a relative path to an absolute path based on base_dir
   */
  getAbsolutePath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }

    return path.resolve(process.cwd(), relativePath);
  }

  /**
   * Get the absolute path to the notes directory
   */
  getNotesDir(): string {
    const absolutePath = this.getAbsolutePath(this.notesDir);
    // Ensure directory exists
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }
    return absolutePath;
  }

  /**
   * Get the absolute path to the database file
   */
  getDatabasePath(): string {
    const absolutePath = this.getAbsolutePath(this.databasePath);
    // Ensure parent directory exists
    const dbDir = path.dirname(absolutePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    return absolutePath;
  }

  /**
   * Get the database URL for better-sqlite3 (file path)
   */
  getDbUrl(): string {
    return this.getDatabasePath();
  }
}
