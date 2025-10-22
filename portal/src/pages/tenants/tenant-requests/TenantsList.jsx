import clsx from 'clsx';
import { EmptyCard } from '../../../components/tickets/TicketCard.jsx';
import { Error } from '../../../components/states/Error.jsx';
import { Loading } from '../../../components/states/Loading.jsx';
import { TenantFilters } from '../../../components/tenants/TenantFilters.jsx';
import { TenantCard } from '../../../components/tenants/TenantCard.jsx';
import { PageHeading } from '../../../components/PageHeading.jsx';
import { Icon } from '../../../atoms/Icon.jsx';
import { TenantColumnControl } from '../../../components/tenants/TenantColumnControl.jsx';

export const TenantsList = ({
  listData,
  listActions,
  filters,
  setFilters,
  setTenantList,
}) => {
  const { initialized, error, loading, data, pageNumber } = listData;
  const { nextPage, previousPage } = listActions;

  const handleSort = field => {
    const newDirection =
      filters.orderBy === field && filters.sortDirection === 'asc'
        ? 'desc'
        : 'asc';
    setFilters(f => ({
      ...f,
      orderBy: field,
      sortDirection: newDirection,
    }));
  };

  return (
    <div className="gutter">
      <div className="max-w-screen-lg pt-1 pb-6">
        <PageHeading title="Tenants" backTo="/" className="flex-wrap">
          <div className="flex-1"></div>
          <TenantFilters
            type="tenants"
            filters={filters}
            setFilters={setFilters}
          />
          <TenantColumnControl filters={filters} setFilters={setFilters} />
        </PageHeading>

        {initialized && (
          <>
            {error ? (
              <Error error={error} />
            ) : (
              <div className="flex-c-st gap-4">
                <div className="flex-c-st gap-4 md:grid md:grid-cols-[auto_2fr_1fr_1fr_auto]">
                  <div className="max-md:hidden col-start-1 col-end-6 grid grid-cols-[subgrid] px-6 py-2 gap-3 items-center font-semibold text-sm text-base-content/60">
                    <button
                      type="button"
                      className="flex-ss gap-2 hover:text-base-content transition md:col-start-2"
                      onClick={() => handleSort('values[Space Slug]')}
                    >
                      Slug Name
                      {filters.orderBy === 'values[Space Slug]' && (
                        <Icon
                          name={
                            filters.sortDirection === 'asc'
                              ? 'arrow-up'
                              : 'arrow-down'
                          }
                          size={14}
                        />
                      )}
                    </button>
                    {filters.visibleColumns?.companyName && (
                      <button
                        type="button"
                        className="flex-ss gap-2 hover:text-base-content transition"
                        onClick={() => handleSort('values[Company Name]')}
                      >
                        Company Name
                        {filters.orderBy === 'values[Company Name]' && (
                          <Icon
                            name={
                              filters.sortDirection === 'asc'
                                ? 'arrow-up'
                                : 'arrow-down'
                            }
                            size={14}
                          />
                        )}
                      </button>
                    )}
                    {filters.visibleColumns?.environmentType && (
                      <button
                        type="button"
                        className="flex-ss gap-2 hover:text-base-content transition"
                        onClick={() => handleSort('values[Environment Type]')}
                      >
                        Environment Type
                        {filters.orderBy === 'values[Environment Type]' && (
                          <Icon
                            name={
                              filters.sortDirection === 'asc'
                                ? 'arrow-up'
                                : 'arrow-down'
                            }
                            size={14}
                          />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex-ee gap-4 hover:text-base-content transition md:col-start-5 pr-5"
                    >
                      Status
                    </button>
                  </div>

                  {/* Loading indicator if we're loading and there is no data */}
                  {loading && !data && (
                    <Loading className="col-start-1 col-end-6" />
                  )}

                  {/* List of data */}
                  {data?.length > 0 &&
                    data.map(listItem => (
                      <TenantCard
                        key={listItem.id}
                        submission={listItem}
                        setTenantList={setTenantList}
                        visibleColumns={filters.visibleColumns}
                      />
                    ))}

                  {/* Empty message if we're not loading and there is no data*/}
                  {data?.length === 0 && (
                    <EmptyCard>
                      There are no tenants to show
                      {previousPage ? ' on this page' : ''}.
                    </EmptyCard>
                  )}

                  {(data?.length > 0 || previousPage) && (
                    <div
                      className={clsx(
                        'col-start-1 col-end-6 py-0.25 md:py-1.75 px-6 flex-cc gap-6',
                        'bg-base-100 border rounded-box md:min-h-16',
                        'max-md:sticky max-md:bottom-4 max-md:outline-2 max-md:outline-base-100',
                      )}
                    >
                      <button
                        type="button"
                        className="kbtn kbtn-ghost kbtn-lg kbtn-circle"
                        onClick={previousPage}
                        disabled={!previousPage || loading}
                        aria-label="Previous Page"
                      >
                        <Icon name="chevrons-left" />
                      </button>
                      {loading ? (
                        <Loading xsmall size={36} />
                      ) : (
                        <div className="font-semibold">Page {pageNumber}</div>
                      )}
                      <button
                        type="button"
                        className="kbtn kbtn-ghost kbtn-lg kbtn-circle"
                        onClick={nextPage}
                        disabled={!nextPage || loading}
                        aria-label="Next Page"
                      >
                        <Icon name="chevrons-right" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
