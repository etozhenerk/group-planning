import { InfoContext } from '@preview/model/InfoContext';
import { useInfoPreview } from '@preview/model/useInfoPreview';
import { InfoSurface } from '@preview/ui/InfoSurface';
export const InfoPreview = () => {
  const model = useInfoPreview();
  return (
    <InfoContext.Provider value={model}>
      <InfoSurface />
    </InfoContext.Provider>
  );
};
