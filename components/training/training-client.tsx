"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModerationTrainer } from "@/components/training/moderation-trainer";
import { SupportTrainer } from "@/components/training/support-trainer";
import { ComplaintsTrainer } from "@/components/training/complaints-trainer";
import { WeeklyQuiz } from "@/components/training/weekly-quiz";
import { QuestsPanel } from "@/components/training/quests-panel";

export function TrainingClient() {
  // Прогресс тренажёров за текущую сессию (для квестов)
  const [modResolved, setModResolved] = useState(0);
  const [supResolved, setSupResolved] = useState(0);
  const [compResolved, setCompResolved] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <GraduationCap className="size-6" /> Обучение
        </h1>
        <p className="text-muted-foreground text-sm">
          Тренажёры, викторина недели и квесты. Зарабатывайте XP за правильные решения.
        </p>
      </div>

      <Tabs defaultValue="moderation">
        <TabsList className="flex-wrap">
          <TabsTrigger value="moderation">Тренажёр чата</TabsTrigger>
          <TabsTrigger value="support">Поддержка</TabsTrigger>
          <TabsTrigger value="complaints">Жалобы</TabsTrigger>
          <TabsTrigger value="quiz">Викторина недели</TabsTrigger>
          <TabsTrigger value="quests">Квесты</TabsTrigger>
        </TabsList>
        <TabsContent value="moderation" className="mt-4">
          <ModerationTrainer onResolved={() => setModResolved((n) => n + 1)} />
        </TabsContent>
        <TabsContent value="support" className="mt-4">
          <SupportTrainer onResolved={() => setSupResolved((n) => n + 1)} />
        </TabsContent>
        <TabsContent value="complaints" className="mt-4">
          <ComplaintsTrainer onResolved={() => setCompResolved((n) => n + 1)} />
        </TabsContent>
        <TabsContent value="quiz" className="mt-4">
          <WeeklyQuiz />
        </TabsContent>
        <TabsContent value="quests" className="mt-4">
          <QuestsPanel modResolved={modResolved} supResolved={supResolved} compResolved={compResolved} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
