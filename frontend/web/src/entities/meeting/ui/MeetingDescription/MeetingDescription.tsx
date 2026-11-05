export type MeetingDescriptionProps = { value: string; change: (value: string) => void };

export const MeetingDescription = ({ value, change }: MeetingDescriptionProps) => (
  <label>
    Описание
    <textarea
      maxLength={4000}
      value={value}
      onChange={(event) => change(event.target.value)}
      placeholder="Что стоит знать друзьям"
      rows={2}
    />
  </label>
);
