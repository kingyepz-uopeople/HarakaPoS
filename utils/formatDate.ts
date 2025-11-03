/**
 * Format a date string or Date object to a readable format
 * @param date - Date string or Date object
 * @param format - 'short' | 'long' | 'time'
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  format: "short" | "long" | "time" = "short"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "short") {
    return dateObj.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (format === "long") {
    return dateObj.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }

  if (format === "time") {
    return dateObj.toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return dateObj.toLocaleDateString("en-KE");
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get date range for a period
 */
export function getDateRange(period: "today" | "week" | "month"): {
  start: string;
  end: string;
} {
  const end = new Date();
  const start = new Date();

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7);
  } else if (period === "month") {
    start.setMonth(start.getMonth() - 1);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
