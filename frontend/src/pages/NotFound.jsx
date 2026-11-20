import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/ui/PageTransition';
import EmptyState from '../components/ui/EmptyState';
export default function NotFound(){
  const navigate=useNavigate();
  return <PageTransition><EmptyState title="Page not found" description="The page you requested does not exist." actionLabel="Go to dashboard" onAction={()=>navigate('/')}/></PageTransition>;
}
