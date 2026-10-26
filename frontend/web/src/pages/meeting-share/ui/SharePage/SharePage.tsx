import { Navigate, useParams } from 'react-router';

export const SharePage = () => {
  const { id = '' } = useParams();

  return <Navigate to={`/meetings/${id}?action=share`} replace />;
};
