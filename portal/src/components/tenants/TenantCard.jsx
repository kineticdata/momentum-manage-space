import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../../atoms/Icon.jsx';
import { StatusPill } from '../tickets/StatusPill.jsx';
import {callIfFn, timeAgo} from '../../helpers/index.js';
import { useSelector } from 'react-redux';
import { Button } from '../../atoms/Button.jsx';
import useSwipe from '../../helpers/hooks/useSwipe.js';
import { FormModal } from '../../atoms/FormModal.jsx';
import { useState } from 'react';
import {toastSuccess} from "../../helpers/toasts.js";

const getMetaData = tenantSubmission => {
  if (['Datastore'].includes(tenantSubmission.type)) {
    const submission = tenantSubmission.submission;
    if (submission?.values?.['Status'] === undefined) {
      const date =
        submission === null
          ? tenantSubmission?.submittedAt
          : submission?.createdAt;

      return {
        status: 'Active',
        dateString: `Closed ${timeAgo(date)}`,
        canDelete: true,
      };
    }

    switch (submission.values['Status']) {
      case 'Active':
        return {
          status: 'Active',
          dateString: `Closed ${timeAgo(submission.submittedAt)}`,
          canDelete: true,
        };
      case 'Decommissioned':
        return {
          status: 'Decommissioned',
          dateString: `Closed ${timeAgo(submission.submittedAt)}`,
        };
      default:
        return {
          status: 'Active',
          dateString: `Active ${timeAgo(submission.createdAt)}`,
          canDelete: true,
        };
    }
  }
};

const getToPath = submission => {
  if (submission.submission === null) {
    const spaceSlug = submission.tenant.slug;

    const params = new URLSearchParams({
      'values[Space Slug]': spaceSlug,
      'values[Custom Space Slug]': 'Yes',
    });

    return `/forms/tenant-deployment?${params.toString()}`;
  }

  return submission.id;
};

export const TenantCard = ({ submission, setTenantList }) => {
  const mobile = useSelector(state => state.view.mobile);
  const location = useLocation();
  const [openModal, setOpenModal] = useState(false);
  const icon =
    submission.submission === null ? 'alert-square-rounded' : 'checklist';
  const meta = getMetaData(submission);
  const { onTouchStart, onTouchMove, onTouchEnd, left, right } = useSwipe({
    threshold: 80,
    onLeftSwipe: () => setOpenModal(true),
  });
  const onModalSubmit = () => {
    setOpenModal(false);
    toastSuccess({ title: 'Successfully decommissioned' });

    setTenantList(prevList =>
        prevList.filter(tenantSubmission => tenantSubmission.id !== submission.id)
    );
  };

  return (
    <div
      className={clsx(
        // Non mobile styles
        'md:col-start-1 md:col-end-5 md:grid md:grid-cols-[subgrid]',
        // Common styles
        'group relative',
      )}
      onTouchStart={mobile && meta.canDelete ? onTouchStart : undefined}
      onTouchMove={mobile && meta.canDelete ? onTouchMove : undefined}
      onTouchEnd={mobile && meta.canDelete ? onTouchEnd : undefined}
    >
      {mobile && meta.canDelete && (
        <div
          className={clsx(
            'absolute top-0 right-0.25 h-full w-24 pl-4',
            'flex flex-col justify-center items-center gap-1',
            'bg-warning-400 text-white rounded-r-xl',
          )}
        >
          <Icon name="trash" />
          <span className="text-xs font-medium">Delete</span>
        </div>
      )}
      <div
        className={clsx(
          // Mobile first styles
          'flex py-0.75 px-1',
          // Non mobile styles
          'md:col-start-1 md:col-end-5 md:grid md:grid-cols-[subgrid] md:py-2.75 md:px-6',
          // Common styles
          'group relative gap-3 items-center min-h-16 rounded-xl',
          'bg-white shadow-card border border-transparent transition',
          'hover:border-primary-500 hover:bg-gray-100 hover:shadow-card-hover',
          'focus-within:border-primary-500 focus-within:bg-gray-100 focus-within:shadow-card-hover',
        )}
        style={{ left, right }}
      >
        <div className="bg-primary-100 border border-primary-400 text-gray-950 rounded-xl shadow-icon flex-none p-1.25 md:p-1.75">
          <Icon
            name={icon}
            className={clsx({
              'text-warning-400': submission.submission === null,
            })}
          />
        </div>
        {mobile ? (
          <div className="flex flex-col gap-1 min-w-0">
            <Link
              className="text-sm font-medium leading-4 line-clamp-2 after:absolute after:inset-0 outline-0"
              to={getToPath(submission)}
              state={{ backPath: location.pathname }}
            >
              {submission.label}
            </Link>
            <div className="text-xs text-gray-900">{meta.dateString}</div>
          </div>
        ) : (
          <>
            <Link
              className="font-medium leading-5 line-clamp-2 after:absolute after:inset-0 outline-0"
              to={getToPath(submission)}
              state={{ backPath: location.pathname }}
            >
              {submission.label}
            </Link>
            <div className="text-gray-900">
              {submission.submission?.values['Company Name']}
            </div>
          </>
        )}
        <div className="max-md:ml-auto flex gap-2 items-center">
          <StatusPill
            className={clsx({
              'group-hover:min-w-20 group-focus-within:min-w-20':
                !mobile && meta.canDelete,
            })}
            status={meta.status}
          />
          {!mobile && meta.canDelete && (
            <Button
              variant="secondary"
              icon="trash"
              size="md"
              className={clsx(
                'relative -my-1 not-group-hover:not-group-focus-within:hidden',
              )}
              onClick={() => setOpenModal(true)}
            />
          )}
        </div>
      </div>
      <FormModal
        open={openModal}
        onOpenChange={({ open }) => setOpenModal(open)}
        onSubmit={onModalSubmit}
      >
        <div slot="description" className="text-center mt-2 space-y-2">
          <div className="font-bold text-xl">Tenant Decommission</div>
          <div className="font-semibold text-warning-500">WARNING!!!</div>
          <div>
            This will completely remove the selected Kinops environment, its
            related task engine, task engine database, Filehub, and Bridgehub
            entries.
          </div>
        </div>
      </FormModal>
    </div>
  );
};
