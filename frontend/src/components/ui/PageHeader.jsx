import './PageHeader.css';

/** Page title + subtitle on the left, action buttons on the right. */
export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        {Icon && (
          <span className="page-header-icon" aria-hidden="true">
            <Icon size={20} />
          </span>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions no-print">{actions}</div>}
    </div>
  );
}
