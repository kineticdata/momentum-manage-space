import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { defineKqlQuery, searchSubmissions } from '@kineticdata/react';
import { TenantsList } from './TenantsList.jsx';
import { TenantDetail } from './TenantDetail.jsx';
import { Form } from '../../forms/Form.jsx';
import { usePaginatedData } from '../../../helpers/hooks/usePaginatedData.js';
import { executeIntegration } from '../../../helpers/api.js';
import { useData } from '../../../helpers/hooks/useData.js';

const buildTenantsSearch = (profile, filters) => {
  // Start query builder
  const search = defineKqlQuery();

  return {
    q: '',
    sortOrder: 'createdAt',
    direction: 'asc',
    include: ['details', 'values', 'form', 'form.attributesMap'],
    limit: 10,
  };
};

export const Tenants = () => {
  const { profile, kappSlug } = useSelector(state => state.app);

  // State for filters
  const [filters, setFilters] = useState({
    status: { draft: false, open: false, closed: false },
  });

  // Parameters for the query (if null, the query will not run)
  const params = useMemo(
    () => ({
      kapp: kappSlug,
      form: 'tenant',
      search: buildTenantsSearch(profile, filters),
    }),
    [kappSlug, profile, filters],
  );

  // Retrieve the data for the tenant list
  const { initialized, loading, response, pageNumber, actions } =
    usePaginatedData(searchSubmissions, params);

  // Parameters for the query (if null, the query will not run)
  const getTenantsParams = useMemo(
    () =>
      open
        ? {
            kappSlug,
            integrationName: 'get-tenants',
            parameters: {},
          }
        : null,
    [kappSlug],
  );

  const { loading: tenantLoading, response: tenantResponse } = useData(
    executeIntegration,
    getTenantsParams,
  );

  const mergeTenantResponses = (submissions = [], tenantData = []) => {
    // Submission with Tenant info
    const mergedSubmissionTenants = submissions.map(submission => {
      const spaceSlug = submission.values['Space Slug'];
      const tenant = tenantData.find(t => t.slug === spaceSlug);

      return tenant
        ? Object.assign({}, submission, {
            label: tenant.name,
            coreState: tenant.status,
          })
        : submission;
    });

    // List of Tenants without submissions
    const tenants = tenantData.filter(
      t => !submissions.some(s => s.values['Space Slug'] === t.slug),
    );

    // Generate submission for tenants
    const generatedTenantSubmissions = tenants.map(tenant => ({
      id: tenant.slug,
      label: tenant.name,
      values: {
        'Space Slug': tenant.slug,
      },
      createdAt: tenant.createdAt,
      submittedAt: tenant.createdAt,
      type: 'Datastore',
    }));

    return [...mergedSubmissionTenants, ...generatedTenantSubmissions];
  };

  return (
    <Routes>
      <Route path=":submissionId" element={<TenantDetail />} />
      <Route path=":submissionId/review" element={<Form review={true} />} />
      <Route
        path="*"
        element={
          <TenantsList
            listData={{
              initialized,
              loading: tenantLoading,
              data: tenantResponse
                ? mergeTenantResponses(
                    response?.submissions,
                    tenantResponse?.spaces,
                  )
                : undefined,
              error: response?.error,
              pageNumber,
            }}
            listActions={actions}
            filters={filters}
            setFilters={setFilters}
          />
        }
      />
    </Routes>
  );
};
