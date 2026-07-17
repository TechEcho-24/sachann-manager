/**
 * Utility functions for the AI Assistant
 * Greeting, motivational messages, and time-based logic
 */

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Get current time in IST
 */
export function getISTHour(): number {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    hour12: false,
  });
  return parseInt(istFormatter.format(now), 10);
}

/**
 * Get time-based greeting
 */
export function getTimeGreeting(): { greeting: string; emoji: string } {
  const hour = getISTHour();
  if (hour >= 5 && hour < 12) return { greeting: "Good Morning Sachann Family", emoji: "🌤️" };
  if (hour >= 12 && hour < 17) return { greeting: "Good Afternoon", emoji: "👋" };
  if (hour >= 17 && hour < 22) return { greeting: "Good Evening", emoji: "🌙" };
  return { greeting: "Good Night", emoji: "✨" };
}

/**
 * 30 curated motivational messages for the daily message system
 */
const MOTIVATIONAL_MESSAGES = [
  "Har chhota record business ko aur strong banata hai. 💪",
  "Aaj ka sahi hisaab, kal ka behtar decision. 📊",
  "Chhoti bachat bhi business ko aage badhati hai. 💰",
  "Safalta planning aur consistency se banti hai. ✅",
  "Har expense ko note karna smart business ki nishani hai. 📝",
  "Ek-ek kadam se bada brand banta hai. 🌟",
  "Aaj ki mehnat kal ki pehchaan banegi. 🙏",
  "Sahi hisaab se business hamesha control mein rehta hai. 🎯",
  "Jo record karta hai, woh manage kar sakta hai. 📈",
  "Aapki mehnat ek din zaroor rang laayegi. 🌺",
  "Chote-chote kharche milkar bade numbers bana dete hain. 🔢",
  "Har din ka hisaab, har mahine ka sukoon. 😌",
  "Business mein transparency hi sabse badi strength hai. 💎",
  "Record rakhne wale hi sahi faisla kar paate hain. 🏆",
  "Aaj ki diligence kal ki prosperity hai. ⭐",
  "Sachann brand ko aur uncha le jaana hai — ek record ek baar mein. 🚀",
  "Paisa ginta hai — aur aap uska hisaab rakh rahe hain. 👍",
  "Ek achi aadat aaj se — sab kuch record karo. 📋",
  "Business ka success 50% kaam, 50% hisaab-kitaab hai. ⚖️",
  "Aapki team aap par bharosa karti hai — records se woh vishwas banta hai. 🤝",
  "Pehle hisaab, phir decision — yahi smart business hai. 💡",
  "Har rupaya count karta hai jab hum usse count karte hain. 💸",
  "Mehnat ka phal meetha hota hai — aaj ke records hi kal ka data hain. 🍯",
  "Sachann ka har kharcha ek step forward hai. 👣",
  "Data se growth milti hai, andhere mein nahi. 🔦",
  "Aaj ek expense record karo — business ka future banao. 🌱",
  "Jo plan karta hai, woh jeetta hai. 🎖️",
  "Ek-ek hisaab se bada picture banta hai. 🖼️",
  "Smart kharche, smart business — yahi mantra hai. 🧠",
  "Aapka discipline hi aapka competitive advantage hai. 💪",
];

/**
 * Get daily motivational message — deterministic per user per day
 * Changes once per day, different per user
 */
export function getDailyMotivation(userId: string): string {
  const index = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
  return MOTIVATIONAL_MESSAGES[index];
}
