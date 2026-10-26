import { Navigate, useParams, useSearchParams } from 'react-router';

export const UploadPage = () => {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const target =
    params.get('purpose') === 'memory'
      ? `/meetings/${id}/memories?action=upload`
      : `/meetings/${id}?action=${params.get('kind') === 'file' ? 'file' : 'photo'}`;

  return <Navigate to={target} replace />;
};
