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
    sortOrder: filters.sortBy,
    direction: filters.sortDirection,
    include: ['details', 'values', 'form', 'form.attributesMap'],
    limit: 10,
  };
};

export const Tenants = () => {
  const { profile, kappSlug } = useSelector(state => state.app);
  const [mergedTenantData, setMergedTenantData] = useState([]);

  // State for filters
  const [filters, setFilters] = useState({
    environmentTypes: [],
    status: { decommissioned: false },
    search: { companyName: '', environmentType: '', spaceSlug: '' },
    sortBy: 'createdAt',
    sortDirection: 'asc',
    visibleColumns: {
      companyName: true,
      environmentType: false,
    },
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

  const { response: tenantForm } = useData(fetchForm, getFormParams);

  // Parameters for the query
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
    // Merge submissions with tenant data
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
    // This ensures that we dont break pagination.
    const missingTenantSubmissions =
      pageNumber === 1 &&
      filters.status.decommissioned === false &&
      filters.search.companyName === '' &&
      filters.search.environmentType === '' &&
      filters.search.spaceSlug === ''
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

  // Sort the merged tenant data based on filters
  const sortedTenantData = useMemo(() => {
    if (!mergedTenantData.length) return [];

    const sorted = [...mergedTenantData].sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'label':
          aValue = a.label || '';
          bValue = b.label || '';
          break;
        case 'status':
          aValue = a.submission?.values?.['Status'] || 'Active';
          bValue = b.submission?.values?.['Status'] || 'Active';
          break;
        case 'companyName':
          aValue = a.submission?.values?.['Company Name'] || '';
          bValue = b.submission?.values?.['Company Name'] || '';
          break;
        case 'environmentType':
          aValue = a.submission?.values?.['Environment Type'] || '';
          bValue = b.submission?.values?.['Environment Type'] || '';
          break;
      }

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [mergedTenantData, filters.sortBy, filters.sortDirection]);

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
            if (subElement.name === 'Environment Type' && subElement.choices) {
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
              data: sortedTenantData,
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
