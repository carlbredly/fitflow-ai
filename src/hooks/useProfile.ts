import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateAll } from "@/lib/calculations";
import type { Profile, Goal, Mode, Sex } from "@/types/database.types";

export function useProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      return data as Profile | null;
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: async (profile: Partial<Profile>) => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...profile })
        .select()
        .single();
      return data as Profile | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  const dbProfile = query.data;

  const calculatedMacros = dbProfile
    ? calculateAll(
        dbProfile.weight_kg ?? 75,
        dbProfile.height_cm ?? 175,
        dbProfile.age ?? 30,
        (dbProfile.sex ?? "m") as Sex,
        (dbProfile.goal ?? "maintain") as Goal,
        (dbProfile.mode ?? "normal") as Mode,
      )
    : null;

  return {
    profile: dbProfile,
    calculatedMacros,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
