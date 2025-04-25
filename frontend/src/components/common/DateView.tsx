"use client";

export interface DateViewProps {
  date: Date;
  className?: string;
}

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DateView(props: DateViewProps) {
  return <p>{formatDate(props.date)}</p>;
}
