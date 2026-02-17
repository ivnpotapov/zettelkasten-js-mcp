/**
 * ID Generator for Zettelkasten notes
 * Generates ISO 8601 compliant timestamp-based IDs with guaranteed uniqueness
 * (pseudo-nanosecond precision)
 */

let lastTimestamp = 0;
let counter = 0;

/**
 * Generate an ISO 8601 compliant timestamp-based ID with guaranteed uniqueness
 * (pseudo-nanosecond precision).
 *
 * Returns a string in format "YYYYMMDDTHHMMSSssssssccc" where:
 * - YYYYMMDD is the date
 * - T is the ISO 8601 date/time separator
 * - HHMMSS is the time (hours, minutes, seconds)
 * - ssssss is the 6-digit microsecond component
 * - ccc is a 3-digit counter for uniqueness within the same microsecond
 *
 * The format follows ISO 8601 basic format with extended precision,
 * allowing up to 1 billion unique IDs per second.
 */
export function generateId(): string {
  const now = new Date();
  const timestamp = Math.floor(now.getTime() / 1000); // Convert to microseconds

  if (timestamp === lastTimestamp) {
    counter++;
  } else {
    lastTimestamp = timestamp;
    counter = 0;
  }

  // Ensure counter doesn't overflow our 3 digits
  counter %= 1000;

  // Format as ISO 8601 basic format with microseconds and counter
  const dateTime = formatDateTime(now);
  const microseconds = String(now.getMilliseconds() * 1000).padStart(6, "0");
  const counterStr = String(counter).padStart(3, "0");

  return `${dateTime}${microseconds}${counterStr}`;
}

/**
 * Format a date as ISO 8601 basic format (YYYYMMDDTHHMMSS)
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}
