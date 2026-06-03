import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getPublicImageUrl(bucket, path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function subscribeChat(conversationId, onNewMessage) {
  const channel = supabase
    .channel(`conv:${conversationId}:messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onNewMessage(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeNotifications(myUserId, onNotification) {
  const channel = supabase.channel(`user:${myUserId}:messages-notifs`, {
    config: { private: true },
  });

  // Reçus
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${myUserId}`,
    },
    (payload) => {
      onNotification({ message: payload.new, type: 'received' });
    }
  );

  // Envoyés
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `sender_id=eq.${myUserId}`,
    },
    (payload) => {
      onNotification({ message: payload.new, type: 'sent' });
    }
  );

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribePresence(conversationId, userId, onPresenceState) {
  const channel = supabase.channel(`conv:${conversationId}:presence`, {
    config: { presence: { key: userId } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      onPresenceState(state);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: userId, joined_at: new Date().toISOString() });
      }
    });

  return () => supabase.removeChannel(channel);
}

export function subscribeNotifications(myUserId, onNotification) {
  const channel = supabase.channel(`user:${myUserId}:messages-notifs`, {
    config: { private: true },
  });

  // Reçus
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${myUserId}`,
    },
    (payload) => {
      onNotification({ message: payload.new, type: 'received' });
    }
  );

  // Envoyés
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `sender_id=eq.${myUserId}`,
    },
    (payload) => {
      onNotification({ message: payload.new, type: 'sent' });
    }
  );

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
