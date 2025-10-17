import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLayoutStore } from '../layoutStore';

describe('useLayoutStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const store = useLayoutStore();

    expect(store.sidebarCollapsed).toBe(false);
    expect(store.notifications).toEqual([]);
  });

  it('should toggle sidebar', () => {
    const store = useLayoutStore();

    expect(store.sidebarCollapsed).toBe(false);

    store.toggleSidebar();
    expect(store.sidebarCollapsed).toBe(true);
    expect(localStorage.getItem('adminSidebarCollapsed')).toBe('true');

    store.toggleSidebar();
    expect(store.sidebarCollapsed).toBe(false);
    expect(localStorage.getItem('adminSidebarCollapsed')).toBe('false');
  });

  it('should set sidebar collapsed state', () => {
    const store = useLayoutStore();

    store.setSidebarCollapsed(true);
    expect(store.sidebarCollapsed).toBe(true);
    expect(localStorage.getItem('adminSidebarCollapsed')).toBe('true');

    store.setSidebarCollapsed(false);
    expect(store.sidebarCollapsed).toBe(false);
    expect(localStorage.getItem('adminSidebarCollapsed')).toBe('false');
  });

  it('should add notification', () => {
    const store = useLayoutStore();

    store.addNotification({
      title: 'Test',
      message: 'Test message',
      type: 'info',
    });

    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.title).toBe('Test');
    expect(store.notifications[0]?.message).toBe('Test message');
    expect(store.notifications[0]?.type).toBe('info');
    expect(store.notifications[0]?.read).toBe(false);
    expect(store.notifications[0]?.id).toBeDefined();
    expect(store.notifications[0]?.timestamp).toBeInstanceOf(Date);
  });

  it('should count unread notifications', () => {
    const store = useLayoutStore();

    expect(store.unreadNotificationsCount).toBe(0);

    store.addNotification({ title: 'Test 1', message: 'Message 1', type: 'info' });
    store.addNotification({ title: 'Test 2', message: 'Message 2', type: 'warning' });

    expect(store.unreadNotificationsCount).toBe(2);

    const firstNotification = store.notifications[0];
    if (firstNotification) {
      store.markNotificationAsRead(firstNotification.id);
      expect(store.unreadNotificationsCount).toBe(1);
    }
  });

  it('should check hasUnreadNotifications', () => {
    const store = useLayoutStore();

    expect(store.hasUnreadNotifications).toBe(false);

    store.addNotification({ title: 'Test', message: 'Message', type: 'info' });
    expect(store.hasUnreadNotifications).toBe(true);

    const notification = store.notifications[0];
    if (notification) {
      store.markNotificationAsRead(notification.id);
      expect(store.hasUnreadNotifications).toBe(false);
    }
  });

  it('should mark notification as read', () => {
    const store = useLayoutStore();

    store.addNotification({ title: 'Test', message: 'Message', type: 'info' });
    const notificationId = store.notifications[0]?.id;

    expect(store.notifications[0]?.read).toBe(false);

    if (notificationId) {
      store.markNotificationAsRead(notificationId);
      expect(store.notifications[0]?.read).toBe(true);
    }
  });

  it('should mark all notifications as read', () => {
    const store = useLayoutStore();

    store.addNotification({ title: 'Test 1', message: 'Message 1', type: 'info' });
    store.addNotification({ title: 'Test 2', message: 'Message 2', type: 'warning' });

    expect(store.notifications.every((n) => !n.read)).toBe(true);

    store.markAllNotificationsAsRead();
    expect(store.notifications.every((n) => n.read)).toBe(true);
  });

  it('should clear notifications', () => {
    const store = useLayoutStore();

    store.addNotification({ title: 'Test 1', message: 'Message 1', type: 'info' });
    store.addNotification({ title: 'Test 2', message: 'Message 2', type: 'warning' });

    expect(store.notifications).toHaveLength(2);

    store.clearNotifications();
    expect(store.notifications).toEqual([]);
  });
});
