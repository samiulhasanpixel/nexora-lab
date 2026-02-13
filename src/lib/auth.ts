import { supabase } from "@/integrations/supabase/client";

export const signUp = async (email: string, password: string, fullName: string, phone: string, role: 'customer' | 'seller') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) throw error;

  // Assign role
  if (data.user) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role });
    if (roleError) throw roleError;
  }

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data?.role;
};

export const generateMockOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
