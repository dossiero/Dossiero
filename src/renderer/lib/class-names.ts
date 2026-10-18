import { clsx, type ClassValue } from "clsx";

export function cn(...classValues: ClassValue[]): string {
  return clsx(classValues);
}
