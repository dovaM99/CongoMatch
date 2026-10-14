import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';

import { GlassTabBar } from '@/components/GlassTabBar';
import { useApp, useServices } from '@/store/app';

export default function TabsLayout() {
  const { session, onboarded } = useApp();
  const svc = useServices();
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const check = () => svc.chat.list().then((l) => setUnread(l.some((c) => c.unread > 0)));
    void check();
    return svc.chat.subscribe(() => void check());
  }, [svc]);

  if (!session) return <Redirect href="/" />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }} tabBar={(props) => <GlassTabBar {...props} badges={{ messages: unread }} />}>
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="plans" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
