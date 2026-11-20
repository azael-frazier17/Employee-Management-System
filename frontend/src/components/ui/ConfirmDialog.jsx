import Modal from './Modal';
import Button from './Button';
export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm action', description, confirmText = 'Confirm', danger = true, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={420}>
      <p className="confirm-copy">{description}</p>
      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
