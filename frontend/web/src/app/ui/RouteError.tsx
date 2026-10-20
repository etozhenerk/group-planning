import { Status } from '@/shared/ui/status';

export const RouteError = () => {
  return (
    <main id="main" className="entry-page">
      <Status
        title="Не удалось открыть страницу"
        text="Обновите страницу, чтобы попробовать снова."
        error
        action={() => window.location.reload()}
        actionLabel="Обновить страницу"
      />
    </main>
  );
};
