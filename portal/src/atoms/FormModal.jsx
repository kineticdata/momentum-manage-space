import t from 'prop-types';
import { getChildSlots } from '../helpers/atoms.js';
import { Modal } from './Modal.jsx';
import { KineticForm } from '../components/kinetic-form/KineticForm.jsx';

/**
 * FormModal wraps a modal with a description slot and a Kinetic form.
 *
 * @param {Object} props
 * @param {string} [props.formSlug] the form to display.
 * @param {string} [props.kappSlug] the kapp the form is in.
 * @param {boolean} [props.open] Whether the modal is open.
 * @param {Function} [props.onOpenChange] Callback for when open state changes.
 * @param {Function} [props.onSubmit] Callback for when the form is submitted.
 * @param {string} [props.size='sm'] Size of the modal.
 * @param {JSX.Element|JSX.Element[]} [props.children] Slot content for modal sections.
 */
export const FormModal = ({
  kappSlug,
  formSlug,
  open,
  onOpenChange,
  onSubmit,
  title = '',
  size = 'sm',
  closeOnEscape,
  closeOnInteractOutside,
  children,
}) => {
  const slots = getChildSlots(children, {
    componentName: 'Modal',
    requiredSlots: [],
    optionalSlots: ['trigger', 'description', 'body', 'footer'],
  });

  return (
    <Modal
      title={title}
      size={size}
      open={open}
      onOpenChange={onOpenChange}
      closeOnEscape={closeOnEscape}
      closeOnInteractOutside={closeOnInteractOutside}
    >
      <div slot="description">{slots.description}</div>
      <div slot="body">
        <KineticForm
          kappSlug={kappSlug}
          formSlug={formSlug}
          completed={onSubmit}
        />
      </div>
    </Modal>
  );
};

FormModal.propTypes = {
  open: t.bool,
  onOpenChange: t.func,
  onSubmit: t.func,
  title: t.string,
  closeOnEscape: t.bool,
  closeOnInteractOutside: t.bool,
  size: t.string,
  toasterId: t.string,
  children: t.node,
};
