import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import {
  defineKqlQuery,
  searchSubmissions,
  fetchForm,
} from '@kineticdata/react';
import { TenantsList } from './TenantsList.jsx';
import { RequestDetail } from '../../tickets/requests/RequestDetail.jsx';
import { Form } from '../../forms/Form.jsx';
import { usePaginatedData } from '../../../helpers/hooks/usePaginatedData.js';
import { executeIntegration } from '../../../helpers/api.js';
import { useData } from '../../../helpers/hooks/useData.js';

const buildTenantsSearch = filters => {
  // Start query builder
  const search = defineKqlQuery();
  search.equals('values[Status]', 'status');
  search.equals('values[Environment Type]', 'environmentType');
  search.equals('values[Company Name]', 'companyName');
  search.equals('values[Space Slug]', 'spaceSlug');

  // End query builder
  search.end();
  return {
    q: search.end()({
      status: filters.status.decommissioned ? 'Decommissioned' : 'Active',
      environmentType: filters.search.environmentType || undefined,
      companyName: filters.search.companyName || undefined,
      spaceSlug: filters.search.spaceSlug || undefined,
    }),
    sortOrder: 'createdAt',
    direction: 'asc',
    include: ['details', 'values', 'form', 'form.attributesMap'],
    limit: 10,
  };
};

export const Tenants = () => {
  const { profile, kappSlug } = useSelector(state => state.app);
  const [mergedTenantData, setMergedTenantData] = useState([]);
  const [filters, setFilters] = useState({
    environmentTypes: [],
    status: { decommissioned: false },
    search: { companyName: '', environmentType: '', spaceSlug: '' },
  });

  const getFormParams = useMemo(
    () =>
      kappSlug
        ? {
            formSlug: 'tenant',
            kappSlug,
            include: 'pages',
          }
        : null,
    [kappSlug],
  );
  const {
    response: tenantForm,
  } = useData(fetchForm, getFormParams);

  const submissionSearchParams = useMemo(
    () => ({
      kapp: kappSlug,
      form: 'tenant',
      search: buildTenantsSearch(filters),
    }),
    [kappSlug, profile, filters],
  );

  // Retrieve the data for the tenant list
  const { initialized, loading, response, pageNumber, actions } =
    usePaginatedData(searchSubmissions, submissionSearchParams);

  const getTenantsParams = useMemo(
    () => ({
      kappSlug,
      integrationName: 'get-tenants',
      parameters: {},
    }),
    [kappSlug],
  );

  const { loading: tenantLoading, response: tenantResponse } = useData(
    executeIntegration,
    getTenantsParams,
  );

  const mergeTenantResponses = (submissions = [], tenantData = []) => {
    // Mere submissions with tenant data
    const merged = submissions.map(submission => {
      const spaceSlug = submission.values['Space Slug'];
      const tenant = tenantData.find(t => t.slug === spaceSlug);

      return {
        id: submission.id,
        label: tenant?.name || submission.label,
        coreState: tenant?.status || submission.coreState,
        createdAt: submission.createdAt,
        submittedAt: submission.submittedAt,
        type: submission.type || 'Datastore',
        tenant: tenant || null,
        submission,
      };
    });

    // List of Tenants without submissions
    const tenantsWithoutSubmissions = tenantData.filter(
      t => !submissions.some(s => s.values['Space Slug'] === t.slug),
    );

    // Create a submission object for each tenant without a submission. Only do this on the first page.
    // This ensures that we dont break of pagination.
    const missingTenantSubmissions =
      pageNumber === 1 && filters.status.decommissioned === false && filters.search.companyName === '' && filters.search.environmentType === '' && filters.search.spaceSlug === ''
        ? tenantsWithoutSubmissions.map(tenant => ({
            id: tenant.slug,
            label: tenant.name,
            coreState: tenant.status,
            createdAt: tenant.createdAt,
            submittedAt: tenant.createdAt,
            type: 'Datastore',
            tenant,
            submission: null,
          }))
        : [];

    return [...missingTenantSubmissions, ...merged];
  };

  useEffect(() => {
    if (!response?.submissions || !tenantResponse?.spaces) {
      return;
    }

    setMergedTenantData(
      mergeTenantResponses(response.submissions, tenantResponse.spaces),
    );
  }, [response, tenantResponse]);

  useEffect(() => {
    if (!tenantForm) {
      return;
    }
    
    let environmentValues = [];

    for (const page of tenantForm.form.pages) {
      for (const element of page.elements) {
        if (element.elements) {
          for (const subElement of element.elements) {
            if (subElement.name === "Environment Type" && subElement.choices) {
              environmentValues = subElement.choices.map(c => c.value);
            }
          }
        }
      }
    }

    setFilters(prev => ({
      ...prev,
      environmentTypes: environmentValues,
    }));
  }, [tenantForm]);

  return (
    <Routes>
      <Route path=":submissionId" element={<RequestDetail />} />
      <Route
        path=":submissionId/review"
        element={<Form review={false} requestPath="tenants" />}
      />
      <Route
        path="*"
        element={
          <TenantsList
            listData={{
              initialized,
              loading: tenantLoading,
              data: mergedTenantData,
              error: response?.error,
              pageNumber,
            }}
            setTenantList={setMergedTenantData}
            listActions={actions}
            filters={filters}
            setFilters={setFilters}
          />
        }
      />
    </Routes>
  );
};
