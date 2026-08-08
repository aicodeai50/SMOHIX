function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type CalendarEventInput = {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
};

export function buildIcsFile(events: CalendarEventInput[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smohix Technologies//RevOps//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(event.start)}`,
      `DTEND:${formatIcsDate(event.end)}`,
      `SUMMARY:${event.title.replace(/\n/g, " ")}`,
    );
    if (event.description) {
      lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${event.location}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export const defaultEventDurationMs = 60 * 60 * 1000;
