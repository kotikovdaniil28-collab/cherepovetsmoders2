import type { Metadata } from "next";
import { TeamHistoryClient } from "@/components/team/team-history-client";

export const metadata: Metadata = {
  title: "Команда — CHEREPOVETS Moderation",
};

export default function TeamPage() {
  return <TeamHistoryClient />;
}
