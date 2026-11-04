import { CalendarDays, ChevronLeft, RefreshCw } from "lucide-react";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { useMeetingsPreview } from "@list/pages/meetings/model/useMeetingsPreview";
import { CalendarView } from "@list/pages/meetings/ui/CalendarView/CalendarView";
import { MonthGroup } from "@list/pages/meetings/ui/MonthGroup/MonthGroup";
import { ListState } from "@list/pages/meetings/ui/ListState/ListState";
import styles from "@list/pages/meetings/ui/PageBody/PageBody.module.css";

export type PageBodyProps = { model: ReturnType<typeof useMeetingsPreview> };

export const PageBody = ({ model: m }: PageBodyProps) => {
  const upcoming = () => {
    m.setNoDate(false);
    m.updatePeriod("upcoming");
  };
  if (m.state === "loading")
    return <SkeletonRows label="Загрузка встреч" variant="cards" count={4} />;
  if (m.state === "error")
    return (
      <ListState
        error
        retry={() => m.updateState("ready")}
        showUpcoming={upcoming}
      />
    );
  return (
    <>
      {m.state === "refresh-error" && (
        <div className={styles.alert} role="alert">
          <span>Не удалось обновить встречи</span>
          <button type="button" onClick={() => m.updateState("ready")}>
            <RefreshCw size={16} />
            Повторить
          </button>
        </div>
      )}
      {m.view === "calendar" ? (
        <>
          <div className={styles.undated}>
            <button
              type="button"
              onClick={() => {
                m.updateView("list");
                m.setNoDate(true);
              }}
            >
              <CalendarDays size={16} />
              Без даты<span>{m.counts.undated}</span>
            </button>
          </div>
          <CalendarView
            day={m.day}
            onSelect={m.setDay}
            page={m.page}
            meetings={m.selected}
            past={m.period === "past"}
          />
        </>
      ) : (
        <>
          <div className={styles.undated}>
            <button type="button" onClick={() => m.setNoDate(!m.noDate)}>
              {m.noDate ? (
                <ChevronLeft size={16} />
              ) : (
                <CalendarDays size={16} />
              )}
              <span>{m.noDate ? "Все встречи" : "Без даты"}</span>
              {!m.noDate && <span>{m.counts.undated}</span>}
            </button>
          </div>
          {m.items.length ? (
            [...m.groups].map(([month, items]) => (
              <MonthGroup
                key={month}
                month={month}
                meetings={items}
                past={m.period === "past"}
              />
            ))
          ) : (
            <ListState
              past={m.period === "past"}
              undated={m.noDate}
              retry={() => m.updateState("ready")}
              showUpcoming={upcoming}
            />
          )}
        </>
      )}
    </>
  );
};
