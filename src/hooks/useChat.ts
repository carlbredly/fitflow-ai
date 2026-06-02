import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { askCoach } from "@/lib/ai-service";
import type { ChatMessage } from "@/types/database.types";

interface ProfileForAI {
  name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string | null;
  mode: string | null;
  target_kcal?: number;
  target_protein?: number;
}

export function useChat(
  userId: string | undefined,
  profile: ProfileForAI | null,
  todayStats: { kcal: number; protein: number; carbs: number; fat: number },
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chatMessages", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(50);
      return (data ?? []) as ChatMessage[];
    },
    enabled: !!userId,
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await supabase.from("chat_messages").delete().eq("user_id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages", userId] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      if (!userId) throw new Error("User not authenticated");

      await supabase.from("chat_messages").insert({
        user_id: userId,
        role: "user",
        content: userMessage,
      });
      queryClient.invalidateQueries({ queryKey: ["chatMessages", userId] });

      const messages = (query.data ?? []).concat({
        role: "user",
        content: userMessage,
      } as ChatMessage);

      const apiMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const reply = await askCoach(
        apiMessages,
        (profile ?? { name: "Utilisateur" }) as any,
        todayStats,
      );

      await supabase.from("chat_messages").insert({
        user_id: userId,
        role: "assistant",
        content: reply,
      });
      queryClient.invalidateQueries({ queryKey: ["chatMessages", userId] });
      return reply;
    },
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
    lastReply: sendMutation.data,
    clearChat: clearMutation.mutate,
  };
}
