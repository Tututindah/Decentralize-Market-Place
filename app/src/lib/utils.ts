import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

export function formatAda(lovelace: number): string {
  return (lovelace / 1_000_000).toFixed(2);
}

export function lovelaceToAda(lovelace: number): number {
  return lovelace / 1_000_000;
}

export function adaToLovelace(ada: number): number {
  return Math.floor(ada * 1_000_000);
}
