import React, { useState, useEffect } from 'react';
import { LANG } from './constants';
import RequestForm from './components/RequestForm';
import SuccessScreen from './components/SuccessScreen';
import AdminDashboard from './components/AdminDashboard';
import DailyReportForm from './components/DailyReportForm';
import DailyReportAdmin from './components/DailyReportAdmin';
import ManageAll from './components/ManageAll';
import PinScreen from './components/PinScreen';
import {
  getLocations,
  getEmployees,
  getBrands,
  getWorkTypes,
  getProducts,
  getTools,
  getUnits,
} from './api';
import './App.css';

export default function App() {
  const [lang, setLang] = useState('en');
  const [view, setView] = useState('form'); // 'form'|'success'|'report'|'reportSuccess'|'pin'|'admin'
  const [lastSubmission, setLastSubmission] = useState(null);
  const [lastReport, setLastReport] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const [adminTab, setAdminTab] = useState('requests'); // 'requests'|'reports'|'manage'
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  // All dynamic dropdown data — loaded once on start, refreshed when admin edits
  const [dropdowns, setDropdowns] = useState({
    locations: [],
    employees: [],
    brands: [],
    workTypes: [],
    products: [],
    tools: [],
    units: [],
  });
  const [dropdownsKey, setDropdownsKey] = useState(0);

  const t = LANG[lang];

  useEffect(() => {
    Promise.allSettled([
      getLocations(),
      getEmployees(),
      getBrands(),
      getWorkTypes(),
      getProducts(),
      getTools(),
      getUnits(),
    ]).then(([locs, emps, brands, wts, prods, tools, units]) => {
      setDropdowns({
        locations: locs.status === 'fulfilled'  ? locs.value   : [],
        employees: emps.status === 'fulfilled'  ? emps.value   : [],
        brands:    brands.status === 'fulfilled' ? brands.value : [],
        workTypes: wts.status === 'fulfilled'   ? wts.value    : [],
        products:  prods.status === 'fulfilled' ? prods.value  : [],
        tools:     tools.status === 'fulfilled' ? tools.value  : [],
        units:     units.status === 'fulfilled' ? units.value  : [],
      });
    });
  }, [dropdownsKey]);

  const handleSubmitted = (submission) => {
    setLastSubmission(submission);
    setRefreshKey(k => k + 1);
    setView('success');
  };

  const handleReportSubmitted = (report) => {
    setLastReport(report);
    setReportRefreshKey(k => k + 1);
    setView('reportSuccess');
  };

  const goTo = (v) => {
    setView(v);
    if (v !== 'success') setLastSubmission(null);
    if (v !== 'reportSuccess') setLastReport(null);
  };

  const goToAdmin = () => {
    if (adminUnlocked) {
      setView('admin');
    } else {
      setView('pin');
    }
  };

  const handlePinUnlock = () => {
    setAdminUnlocked(true);
    setView('admin');
  };

  const isWorkerView = ['form', 'success', 'report', 'reportSuccess'].includes(view);
  const isPinView = view === 'pin';
  const isAdminView = view === 'admin';

  const isFormActive   = view === 'form'   || view === 'success';
  const isReportActive = view === 'report' || view === 'reportSuccess';

  const pageTitle =
    isAdminView ? t.adminTitle
    : view === 'report' || view === 'reportSuccess' ? t.reportTitle
    : view === 'success' ? t.successTitle
    : t.formTitle;

  const pageSub =
    isAdminView ? t.adminSub
    : view === 'report' ? t.reportSub
    : view === 'success' || view === 'reportSuccess' ? ''
    : t.formSub;

  // Convenience derived arrays for passing to forms
  const siteNames     = dropdowns.locations.map(l => l.name);
  const employeeNames = dropdowns.employees.map(e => e.name);
  const brandNames    = dropdowns.brands.map(b => b.name);
  const workTypeNames = dropdowns.workTypes.map(w => w.name);
  const toolNames     = dropdowns.tools.map(t => t.name);
  const unitNames     = dropdowns.units.map(u => u.name);

  return (
    <div className="app">
      <header className="header">
        <div className="headerTop">
          <span className="brand">{t.appSub}</span>
          <div className="langToggle">
            <button className={"langBtn" + (lang === 'en' ? ' langActive' : '')} onClick={() => setLang('en')}>EN</button>
            <button className={"langBtn" + (lang === 'es' ? ' langActive' : '')} onClick={() => setLang('es')}>ES</button>
          </div>
        </div>
        {!isPinView && (
          <div className="pageHeader">
            <h1 className="pageTitle">{pageTitle}</h1>
            {pageSub && <p className="pageSub">{pageSub}</p>}
          </div>
        )}
        {!isPinView && (
          <nav className="nav">
            <button className={"navBtn" + (isFormActive   ? ' navActive' : '')} onClick={() => goTo('form')}>
              {t.navForm}
            </button>
            <button className={"navBtn" + (isReportActive ? ' navActive' : '')} onClick={() => goTo('report')}>
              {t.navReport}
            </button>
            <button className={"navBtn" + (isAdminView    ? ' navActive' : '')} onClick={goToAdmin}>
              {t.navAdmin}
            </button>
          </nav>
        )}
      </header>

      <main className="main">
        {view === 'form' && (
          <RequestForm
            lang={t}
            onSubmitted={handleSubmitted}
            extraSites={siteNames}
            employees={employeeNames}
            brands={brandNames}
            workTypes={workTypeNames}
            products={dropdowns.products}
            tools={toolNames}
            units={unitNames}
          />
        )}

        {view === 'success' && lastSubmission && (
          <SuccessScreen lang={t} submission={lastSubmission} onReset={() => goTo('form')} />
        )}

        {view === 'report' && (
          <DailyReportForm
            lang={t}
            onSubmitted={handleReportSubmitted}
            extraSites={siteNames}
            employees={employeeNames}
          />
        )}

        {view === 'reportSuccess' && (
          <div className="reportSuccess">
            <div className="rsIcon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4.5 10.5l4 4 7-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="rsTitle">{t.reportSuccessTitle}</h2>
            <p className="rsSub">{t.reportSuccessSub}</p>
            {lastReport && (
              <div className="rsCard">
                <div className="rsRow">
                  <span className="rsLabel">Employee</span>
                  <span className="rsVal">{lastReport.employeeName}</span>
                </div>
                <div className="rsRow">
                  <span className="rsLabel">Job Site</span>
                  <span className="rsVal">{lastReport.jobSite}</span>
                </div>
                <div className="rsRow">
                  <span className="rsLabel">Photos</span>
                  <span className="rsVal">{lastReport.photoUrls?.length || 0} uploaded</span>
                </div>
                {lastReport.notes && (
                  <div className="rsRow">
                    <span className="rsLabel">Notes</span>
                    <span className="rsVal">{lastReport.notes}</span>
                  </div>
                )}
              </div>
            )}
            <button className="rsResetBtn" onClick={() => goTo('report')}>{t.newReport}</button>
          </div>
        )}

        {isPinView && (
          <PinScreen lang={t} onUnlock={handlePinUnlock} onBack={() => goTo('form')} />
        )}

        {isAdminView && (
          <div className="adminArea">
            <div className="adminTabs">
              <button
                className={"adminTabBtn" + (adminTab === 'requests' ? ' adminTabActive' : '')}
                onClick={() => setAdminTab('requests')}
              >
                {t.adminRequestsTab}
              </button>
              <button
                className={"adminTabBtn" + (adminTab === 'reports' ? ' adminTabActive' : '')}
                onClick={() => setAdminTab('reports')}
              >
                {t.adminReportsTab}
              </button>
              <button
                className={"adminTabBtn" + (adminTab === 'manage' ? ' adminTabActive' : '')}
                onClick={() => setAdminTab('manage')}
              >
                {t.adminLocationsTab}
              </button>
            </div>

            {adminTab === 'requests' && (
              <AdminDashboard
                lang={t}
                refreshKey={refreshKey}
                sites={siteNames}
              />
            )}
            {adminTab === 'reports' && (
              <DailyReportAdmin
                lang={t}
                refreshKey={reportRefreshKey}
                sites={siteNames}
              />
            )}
            {adminTab === 'manage' && (
              <ManageAll
                lang={t}
                onLocationsChange={(locs) => setDropdowns(d => ({ ...d, locations: locs }))}
                onChanged={() => setDropdownsKey(k => k + 1)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
