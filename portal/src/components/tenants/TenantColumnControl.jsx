import { useSelector } from 'react-redux';
import { useCallback, useState } from 'react';
import { produce } from 'immer';
import { Panel } from '../../atoms/Panel.jsx';
import { Popover } from '../../atoms/Popover.jsx';
import t from 'prop-types';
import { Icon } from '../../atoms/Icon.jsx';

export const TenantColumnControl = ({ filters, setFilters }) => {
  const mobile = useSelector(state => state.view.mobile);
  // Open state for the filters popover/panel
  const [open, setOpen] = useState(false);
  // Handler for changing of the popover/panel open state
  const handleOnOpenChange = useCallback(
    ({ open }) => {
      // Reset the temp filters with the latest values
      setFilters(filters);
      setOpen(open);
    },
    [filters],
  );

  // Select a component to use for showing the filters based on the screen size
  const FilterComponent = mobile ? Panel : Popover;

  return (
    <div className="flex-bc gap-2 md:gap-5 items-center ml-auto">
      <FilterComponent
        open={open}
        onOpenChange={handleOnOpenChange}
        alignment={!mobile ? 'end' : undefined}
        width="w-[16rem]"
      >
        <button type="button" className="kbtn" slot="trigger">
          <Icon name={'layout-columns'} />
        </button>
        <div slot="content" className="flex-c-st gap-6">
          <div className="flex-bc gap-3">
            <span className="h3">Columns</span>
            <button
              className="kbtn kbtn-sm kbtn-circle kbtn-ghost absolute right-2 top-2"
              onClick={() => setOpen(false)}
            >
              <Icon name="x" size={20} />
            </button>
          </div>

          <div className="px-4 pt-1 pb-3 flex-c-st gap-4">
            <div className="flex flex-col gap-3">
              <label className="field flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.visibleColumns?.companyName ?? true}
                  onChange={e => {
                    setFilters(f =>
                      produce(f, draft => {
                        if (!draft.visibleColumns) draft.visibleColumns = {};
                        draft.visibleColumns.companyName = e.target.checked;
                      }),
                    );
                  }}
                />
                <span>Company Name</span>
              </label>
              <label className="field flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.visibleColumns?.environmentType ?? false}
                  onChange={e => {
                    setFilters(f =>
                      produce(f, draft => {
                        if (!draft.visibleColumns) draft.visibleColumns = {};
                        draft.visibleColumns.environmentType = e.target.checked;
                      }),
                    );
                  }}
                />
                <span>Environment Type</span>
              </label>
            </div>
          </div>
        </div>
      </FilterComponent>
    </div>
  );
};

TenantColumnControl.propTypes = {
  filters: t.object.isRequired,
  setFilters: t.func.isRequired,
};
