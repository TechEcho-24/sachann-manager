import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTimeGreeting, getDailyMotivation } from "@/lib/assistant/greeting";
import { ChatInterface } from "@/components/assistant/ChatInterface";

export const metadata = {
  title: "Kharcha Saathi | Sachann Manager",
  description: "AI-powered expense assistant for Sachann brand",
};

export default async function AssistantPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { greeting, emoji } = getTimeGreeting();
  const userName = session.user.name || "ji";
  const userId = session.user.id || "default";

  const initialGreeting = `${greeting}, ${userName} ${emoji}`;
  const dailyMotivation = getDailyMotivation(userId);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      <div className="flex-1 overflow-hidden lg:m-6 lg:rounded-2xl lg:shadow-lg lg:border lg:border-border lg:overflow-hidden">
        <ChatInterface
          initialGreeting={initialGreeting}
          dailyMotivation={dailyMotivation}
          userName={userName}
          userId={userId}
        />
      </div>
    </div>
  );
}
