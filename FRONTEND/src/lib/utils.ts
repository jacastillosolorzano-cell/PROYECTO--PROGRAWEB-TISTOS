import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateLevel = (points: number): number => {
  return Math.floor(points / 1000) + 1; 
};

export const gainPoints = (currentPoints: number, activity: string): number => {
  const pointGains: Record<string, number> = { 
    chat: 10, 
    watchVideo: 50, 
    like: 20, 
    login: 100,
 };
  return currentPoints + (pointGains[activity] || 0);
};

export const checkLevelUp = (oldPoints: number, newPoints: number): number | null => {
  const oldLevel = calculateLevel(oldPoints);
  const newLevel = calculateLevel(newPoints);
  return newLevel > oldLevel ? newLevel : null; 
};

export const formatPoints = (points: number): string => {
  return points.toLocaleString('es-ES'); 
};

