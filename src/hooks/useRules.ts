import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { cacheOperations, syncManager } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { RulesDocT, RuleAcknowledgementT, RulesFormDataT, searchRules, parseRulesMarkdown } from '../types/rules';

// Get current active rules
export const useRules = () => {
  return useQuery({
    queryKey: ['rules', 'active'],
    queryFn: async (): Promise<RulesDocT | null> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('rules')
          .select(`
            *,
            profiles:created_by(full_name, email)
          `)
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // No rows found
          throw error;
        }

        // Cache the active rules
        await cacheOperations.upsertCache('active_rules_cache', [data]);
        
        return data;
      } else {
        const cachedData = await cacheOperations.getCache('active_rules_cache');
        return cachedData[0] || null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get all rules (admin only)
export const useAllRules = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['rules', 'all'],
    queryFn: async (): Promise<RulesDocT[]> => {
      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('rules')
          .select(`
            *,
            profiles:created_by(full_name, email)
          `)
          .order('published_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        const cachedData = await cacheOperations.getCache('rules_cache');
        return cachedData;
      }
    },
    enabled: user?.role === 'admin',
  });
};

// Get user's rule acknowledgment status
export const useRuleAcknowledgment = () => {
  const { user } = useAuthStore();
  const { data: activeRules } = useRules();

  return useQuery({
    queryKey: ['rule-acknowledgment', user?.id, activeRules?.id],
    queryFn: async (): Promise<{
      hasAcknowledged: boolean;
      acknowledgment: RuleAcknowledgementT | null;
      needsAcknowledgment: boolean;
    }> => {
      if (!user || !activeRules) {
        return { hasAcknowledged: false, acknowledgment: null, needsAcknowledgment: false };
      }

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('rule_acknowledgements')
          .select('*')
          .eq('user_id', user.id)
          .eq('rule_id', activeRules.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No acknowledgment found
            return { hasAcknowledged: false, acknowledgment: null, needsAcknowledgment: true };
          }
          throw error;
        }

        return { hasAcknowledged: true, acknowledgment: data, needsAcknowledgment: false };
      } else {
        const cachedData = await cacheOperations.getCache('rule_acknowledgements_cache');
        const acknowledgment = cachedData.find((ack: RuleAcknowledgementT) => 
          ack.user_id === user.id && ack.rule_id === activeRules.id
        );

        return { 
          hasAcknowledged: !!acknowledgment, 
          acknowledgment: acknowledgment || null,
          needsAcknowledgment: !acknowledgment,
        };
      }
    },
    enabled: !!user && !!activeRules,
  });
};

// Create new rules version (admin only)
export const useCreateRules = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RulesFormDataT): Promise<RulesDocT> => {
      if (!user || user.role !== 'admin') {
        throw new Error('Only admins can create rules');
      }

      const rulesData = {
        id: crypto.randomUUID(),
        ...data,
        published_at: new Date().toISOString(),
        created_by: user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        // First, deactivate all existing rules
        await supabase
          .from('rules')
          .update({ is_active: false })
          .eq('is_active', true);

        // Create new rules version
        const { data: result, error } = await supabase
          .from('rules')
          .insert(rulesData)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...rulesData,
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('rules_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('rules', 'INSERT', rulesData);
        
        return rulesData as RulesDocT;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['rule-acknowledgment'] });
    },
  });
};

// Acknowledge current rules
export const useAcknowledgeRules = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (ruleId: string): Promise<RuleAcknowledgementT> => {
      if (!user) throw new Error('User not authenticated');

      const acknowledgmentData = {
        id: crypto.randomUUID(),
        rule_id: ruleId,
        user_id: user.id,
        acknowledged_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      if (await syncManager.isOnline()) {
        const { data, error } = await supabase
          .from('rule_acknowledgements')
          .insert(acknowledgmentData)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Store in cache and mutation queue
        const cacheEntry = {
          ...acknowledgmentData,
          sync_status: 'pending',
        };
        
        await cacheOperations.upsertCache('rule_acknowledgements_cache', [cacheEntry]);
        await cacheOperations.addToMutationQueue('rule_acknowledgements', 'INSERT', acknowledgmentData);
        
        return acknowledgmentData as RuleAcknowledgementT;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rule-acknowledgment'] });
    },
  });
};

// Search rules
export const useSearchRules = (query: string) => {
  const { data: rules } = useRules();

  return useQuery({
    queryKey: ['rules-search', query, rules?.id],
    queryFn: async () => {
      if (!rules || !query.trim()) {
        return { sections: [], highlights: [] };
      }

      return searchRules(rules.markdown, query);
    },
    enabled: !!rules && !!query.trim(),
  });
};

// Get rules statistics (admin only)
export const useRulesStats = () => {
  const { user } = useAuthStore();
  const { data: activeRules } = useRules();

  return useQuery({
    queryKey: ['rules-stats', activeRules?.id],
    queryFn: async () => {
      if (!activeRules || !(await syncManager.isOnline())) {
        return {
          totalMembers: 0,
          acknowledgedCount: 0,
          pendingCount: 0,
          acknowledgmentRate: 0,
        };
      }

      // Get total members
      const { data: members } = await supabase
        .from('profiles')
        .select('id')
        .neq('role', 'admin');

      // Get acknowledgments for current rules
      const { data: acknowledgments } = await supabase
        .from('rule_acknowledgements')
        .select('user_id')
        .eq('rule_id', activeRules.id);

      const totalMembers = members?.length || 0;
      const acknowledgedCount = acknowledgments?.length || 0;
      const pendingCount = totalMembers - acknowledgedCount;
      const acknowledgmentRate = totalMembers > 0 ? (acknowledgedCount / totalMembers) * 100 : 0;

      return {
        totalMembers,
        acknowledgedCount,
        pendingCount,
        acknowledgmentRate,
      };
    },
    enabled: user?.role === 'admin' && !!activeRules,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

// Get all acknowledgments for a rules version (admin only)
export const useRuleAcknowledgments = (ruleId?: string) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['rule-acknowledgments', ruleId],
    queryFn: async (): Promise<RuleAcknowledgementT[]> => {
      if (!ruleId || !(await syncManager.isOnline())) return [];

      const { data, error } = await supabase
        .from('rule_acknowledgements')
        .select(`
          *,
          profiles:user_id(full_name, email, plot_number)
        `)
        .eq('rule_id', ruleId)
        .order('acknowledged_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: user?.role === 'admin' && !!ruleId,
  });
};

// Parse and format rules for display
export const useFormattedRules = () => {
  const { data: rules } = useRules();

  return useQuery({
    queryKey: ['formatted-rules', rules?.id],
    queryFn: async () => {
      if (!rules) return null;

      const sections = parseRulesMarkdown(rules.markdown);
      
      return {
        ...rules,
        sections,
        tableOfContents: sections.map(section => ({
          title: section.title,
          id: section.id,
        })),
      };
    },
    enabled: !!rules,
  });
};