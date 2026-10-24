/**
 * Day and Night Contextual Greeting Helper for EDOPS Portals
 * 
 * Time intervals:
 * - 05:00 – 11:59: Morning ("Good Morning", 🌅)
 * - 12:00 – 16:59: Afternoon ("Good Afternoon", ☀️)
 * - 17:00 – 20:59: Evening ("Good Evening", 🌆)
 * - 21:00 – 04:59: Night ("Good Night", 🌙)
 */

export interface TimeGreetingInfo {
  greeting: string;
  icon: string;
  hour: number;
}

export function getTimeGreeting(customDate?: Date): TimeGreetingInfo {
  const d = customDate || new Date();
  const hour = d.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good Morning",
      icon: "🌅",
      hour,
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good Afternoon",
      icon: "☀️",
      hour,
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: "Good Evening",
      icon: "🌆",
      hour,
    };
  } else {
    return {
      greeting: "Good Night",
      icon: "🌙",
      hour,
    };
  }
}
