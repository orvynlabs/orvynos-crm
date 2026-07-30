"use server";

import { prisma, withRetry } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type RevenueGoalData = {
  targetGoal: number;
  achievedGoal: number;
};

export async function getRevenueGoal(): Promise<RevenueGoalData> {
  try {
    const [targetSetting, achievedSetting] = await Promise.all([
      withRetry(() => prisma.systemSetting.findUnique({ where: { key: "revenue_target_goal" } })),
      withRetry(() => prisma.systemSetting.findUnique({ where: { key: "revenue_achieved_goal" } })),
    ]);

    const targetGoal = targetSetting ? Number(targetSetting.value) || 50000 : 50000;
    const achievedGoal = achievedSetting ? Number(achievedSetting.value) || 29000 : 29000;

    return { targetGoal, achievedGoal };
  } catch (error) {
    console.error("[getRevenueGoal] Error:", error);
    return { targetGoal: 50000, achievedGoal: 29000 };
  }
}

export async function updateRevenueGoal(targetGoal: number, achievedGoal: number) {
  try {
    const cleanTarget = Math.max(1, targetGoal);
    const cleanAchieved = Math.max(0, achievedGoal);

    await Promise.all([
      withRetry(() =>
        prisma.systemSetting.upsert({
          where: { key: "revenue_target_goal" },
          update: { value: String(cleanTarget) },
          create: { key: "revenue_target_goal", value: String(cleanTarget) },
        })
      ),
      withRetry(() =>
        prisma.systemSetting.upsert({
          where: { key: "revenue_achieved_goal" },
          update: { value: String(cleanAchieved) },
          create: { key: "revenue_achieved_goal", value: String(cleanAchieved) },
        })
      ),
    ]);

    revalidatePath("/", "layout");
    return { success: true, targetGoal: cleanTarget, achievedGoal: cleanAchieved };
  } catch (error: any) {
    console.error("[updateRevenueGoal] Error:", error);
    return { success: false, error: error.message || "Failed to update revenue goal" };
  }
}
