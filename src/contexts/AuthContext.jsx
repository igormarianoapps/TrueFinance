import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authEvent, setAuthEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Busca o perfil do usuário (status da assinatura)
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, plan_interval')
        .eq('id', userId)
        .single();
      
      if (data) setProfile(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Timeout de segurança: 1 segundo é suficiente se não bloquearmos no fetchProfile
    const safetyTimer = setTimeout(() => { 
      if (mounted) setLoading(false);
    }, 1000);

    // 2. Listener de Mudanças de Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setAuthEvent('PASSWORD_RECOVERY');
      } else if (event === 'SIGNED_IN' && session) {
        // Se acabou de logar, busca o perfil
        // Não usamos 'await' aqui para não bloquear a UI
        fetchProfile(session.user.id);
        setAuthEvent(null);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setAuthEvent(null);
      } else {
        // Mantém PASSWORD_RECOVERY se ele já estava ativo, senão atualiza
        setAuthEvent(prev => prev === 'PASSWORD_RECOVERY' ? 'PASSWORD_RECOVERY' : event);
      }
      
      setLoading(false);
      clearTimeout(safetyTimer); // Agora sim, limpamos o timer pois tudo carregou com sucesso.
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Função exposta para forçar atualização do perfil (ex: após pagamento)
  const refreshProfile = async () => {
    if (user) return await fetchProfile(user.id);
    return null;
  };

  const value = {
    session,
    user,
    profile,
    authEvent,
    loading,
    isPro: profile?.subscription_status === 'active',
    signOut,
    refreshProfile,
    setAuthEvent // Necessário para limpar o estado após reset de senha
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};