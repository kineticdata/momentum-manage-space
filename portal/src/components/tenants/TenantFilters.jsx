import { useSelector } from 'react-redux';
import { useCallback, useState } from 'react';
import { produce } from 'immer';
import { Panel } from '../../atoms/Panel.jsx';
import { Popover } from '../../atoms/Popover.jsx';
import { Button, ChipButton, CloseButton } from '../../atoms/Button.jsx';
import t from 'prop-types';
import { StatusDot } from '../tickets/StatusPill.jsx';

export const TenantFilters = ({ type, filters, setFilters }) => {
  const mobile = useSelector(state => state.view.mobile);

  // Handler for changing individual filter values
  const handleFilterChange = useCallback(
    (name, property, value) => () => {
      setFilters(f =>
        produce(f, f => {
          f[name][property] = value;
        }),
      );
    },
    [setFilters],
  );
  // Temp filters to use while the panel/popover is open that we can then apply
  const [tempFilters, setTempFilters] = useState(filters);
  // Handler for changing individual temp filter values
  const handleTempFilterChange = useCallback(
    (name, property, value) => () => {
      setTempFilters(f =>
        produce(f, f => {
          f[name][property] = value;
        }),
      );
    },
    [],
  );
  // Handler to reset all filters to false so we show all records
  const handleTempFilterClearAll = useCallback(() => {
    setTempFilters(f =>
      produce(f, draft => {
        Object.keys(draft).forEach(name => {
          Object.keys(draft[name]).forEach(property => {
            const value = draft[name][property];

            if (typeof value === 'boolean') {
              draft[name][property] = false;
            } else if (typeof value === 'string') {
              draft[name][property] = '';
            } else if (typeof value === 'number') {
              draft[name][property] = 0;
            } else if (Array.isArray(value)) {
              draft[name][property] = [];
            } else if (value && typeof value === 'object') {
              draft[name][property] = {};
            } else {
              draft[name][property] = null;
            }
          });
        });
      }),
    );
  }, []);
  // Handler for applying the temp filters from the popover/panel
  const handleApplyTempFilters = useCallback(() => {
    setFilters(tempFilters);
    setOpen(false);
  }, [setFilters, tempFilters]);

  // Open state for the filters popover/panel
  const [open, setOpen] = useState(false);
  // Handler for changing of the popover/panel open state
  const handleOnOpenChange = useCallback(
    ({ open }) => {
      // Reset the temp filters with the latest values
      setTempFilters(filters);
      setOpen(open);
    },
    [filters],
  );

  // Is an assignment filter value set
  const hasAssignment = Object.values(filters.assignment || {}).some(v => v);
  // Is a status filter value set
  const hasStatus = Object.values(filters.status || {}).some(v => v);
  // Are all filter values unset
  const hasNone = !hasAssignment && !hasStatus;
  // Are all temp filter values unset
  const hasNoneTemp =
    !Object.values(tempFilters.assignment || {}).some(v => v) &&
    !Object.values(tempFilters.status || {}).some(v => v);

  // Select a component to use for showing the filters based on the screen size
  const FilterComponent = mobile ? Panel : Popover;

  return (
    <div className="flex justify-between gap-2 md:gap-5 items-center max-xl:self-stretch">
      {!hasNone && (
        <div className="flex max-md:flex-col gap-2 md:gap-4 flex-wrap">
          {hasStatus && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium">Status</span>
              {filters.status.decommissioned && (
                <ChipButton
                  active={true}
                  icon="x"
                  onClick={handleFilterChange(
                    'status',
                    'decommissioned',
                    false,
                  )}
                >
                  Decommissioned
                  <StatusDot status="Decommissioned" />
                </ChipButton>
              )}
            </div>
          )}
        </div>
      )}
      {filters.search.companyName !== '' && (
        <ChipButton
          active={true}
          icon="x"
          onClick={handleFilterChange('search', 'companyName', '')}
        >
          {filters.search.companyName}
          <StatusDot status="Closed" />
        </ChipButton>
      )}
      {filters.search.environmentType !== '' && (
        <ChipButton
          active={true}
          icon="x"
          onClick={handleFilterChange('search', 'environmentType', '')}
        >
          {filters.search.environmentType}
          <StatusDot status="Closed" />
        </ChipButton>
      )}
      {filters.search.spaceSlug !== '' && (
        <ChipButton
          active={true}
          icon="x"
          onClick={handleFilterChange('search', 'spaceSlug', '')}
        >
          {filters.search.spaceSlug}
          <StatusDot status="Closed" />
        </ChipButton>
      )}

      <FilterComponent
        open={open}
        onOpenChange={handleOnOpenChange}
        alignment={!mobile ? 'end' : undefined}
      >
        <Button
          slot="trigger"
          variant={hasNone ? 'tertiary' : 'secondary'}
          size={mobile ? (hasNone ? 'sm' : 'md') : 'lg'}
          iconEnd={hasNone ? 'chevron-down' : 'filter'}
        >
          {hasNone && `All ${type}`}
        </Button>
        <div slot="content" className="flex flex-col gap-6">
          <div className="flex justify-between items-center gap-3">
            <span className="h3">Filter</span>
            <CloseButton onClick={() => setOpen(false)}></CloseButton>
          </div>

          <div className="px-4 pt-1 pb-3 flex flex-col gap-4 border-b border-primary-300">
            <div className="flex gap-5">
              <ChipButton
                active={hasNoneTemp}
                icon={hasNoneTemp ? 'check' : null}
                onClick={handleTempFilterClearAll}
                disabled={hasNoneTemp}
              >
                All {type}
              </ChipButton>
            </div>
          </div>

          {tempFilters.status && (
            <div className="px-4 pt-1 pb-3 flex flex-col gap-4">
              <span className="font-medium">Status</span>
              <div className="flex gap-5">
                <ChipButton
                  active={tempFilters.status.decommissioned}
                  icon={tempFilters.status.decommissioned ? 'check' : null}
                  onClick={handleTempFilterChange(
                    'status',
                    'decommissioned',
                    !tempFilters.status.decommissioned,
                  )}
                >
                  Decommissioned
                  <StatusDot status="Decommissioned" />
                </ChipButton>
              </div>
            </div>
          )}

          <div className="px-4 pt-1">
            <span className="font-medium">Search</span>
          </div>

          <div className="field">
            <input
              type="text"
              name="Search"
              placeholder="Company Name"
              value={tempFilters.search.companyName}
              onChange={e =>
                handleTempFilterChange(
                  'search',
                  'companyName',
                  e.target.value,
                )()
              }
              autoComplete="off"
            />
          </div>

          <div className="field">
            <input
              type="text"
              name="Search"
              placeholder="Space Slug"
              value={tempFilters.search.spaceSlug}
              onChange={e =>
                handleTempFilterChange('search', 'spaceSlug', e.target.value)()
              }
              autoComplete="off"
            />
          </div>

          <div className="field">
            <select
              data-element-type="field"
              className="w-full"
              value={tempFilters.search.environmentType}
              onChange={e =>
                handleTempFilterChange(
                  'search',
                  'environmentType',
                  e.target.value,
                )()
              }
            >
              <option value="" disabled hidden>
                Environment Type
              </option>
              {filters.environmentTypes.map(environmentType => (
                <option value={environmentType}>{environmentType}</option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleApplyTempFilters}
            className="mt-auto"
          >
            Show Results
          </Button>
        </div>
      </FilterComponent>
    </div>
  );
};

TenantFilters.propTypes = {
  type: t.oneOf(['tenants']).isRequired,
  filters: t.object.isRequired,
  setFilters: t.func.isRequired,
};
