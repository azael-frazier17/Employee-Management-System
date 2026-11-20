import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="card" style={{ padding: '40px 20px' }}>
      <EmptyState
        icon={Compass}
        title="404 — Page not found"
        message="The page you are looking for does not exist or may have been moved."
        action={
          <Link to="/">
            <Button icon={ArrowLeft}>Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
