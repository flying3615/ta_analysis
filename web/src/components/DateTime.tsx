import { DateTime as LuxonDateTime } from "luxon";
import { ReactNode } from "react";

export interface DateTimeProps {
  datetime?: string | Date;
}

export function DateTime({ datetime }: DateTimeProps): ReactNode {
  if (!datetime) {
    return null;
  } else if (typeof datetime === "string") {
    datetime = new Date(datetime);
  }

  return <time dateTime={datetime.toISOString()}>{formatDateTime(datetime)}</time>;
}

function formatDateTime(value: Date): string {
  return LuxonDateTime.fromJSDate(value).toFormat("h:mma 'on' d MMM yyyy").replace("AM", "am").replace("PM", "pm");
}
