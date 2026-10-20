import { createElement } from 'react';
import { createBrowserRouter } from 'react-router';
import { Root } from '@/app/ui/Root';
import { RouteLoading } from '@/app/ui/RouteLoading';
import { RouteError } from '@/app/ui/RouteError';

export const router = createBrowserRouter([
  {
    element: createElement(Root),
    HydrateFallback: RouteLoading,
    ErrorBoundary: RouteError,
    children: [
      {
        path: '/',
        lazy: async () => ({ Component: (await import('@/pages/landing')).LandingPage }),
      },
      {
        path: '/meetings',
        lazy: async () => ({
          Component: (await import('@/pages/meetings')).MeetingsPage,
        }),
      },
      {
        path: '/meetings/new',
        lazy: async () => ({
          Component: (await import('@/pages/meeting-create')).CreatePage,
        }),
      },
      {
        path: '/meetings/:id/created',
        lazy: async () => ({
          Component: (await import('@/pages/meeting-created')).CreatedPage,
        }),
      },
      {
        path: '/meetings/:id',
        lazy: async () => ({ Component: (await import('@/pages/meeting')).MeetingPage }),
      },
      {
        path: '/i/:token',
        lazy: async () => ({
          Component: (await import('@/pages/invitation')).InvitationPage,
        }),
      },
      {
        path: '/invitations/:token',
        lazy: async () => ({
          Component: (await import('@/pages/invitation')).InvitationPage,
        }),
      },
      {
        path: '/auth/return',
        lazy: async () => ({
          Component: (await import('@/pages/auth-return')).AuthReturnPage,
        }),
      },
      {
        path: '*',
        lazy: async () => ({
          Component: (await import('@/pages/not-found')).NotFoundPage,
        }),
      },
    ],
  },
]);
