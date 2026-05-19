import React, { useState } from 'react';
import { LANG } from './constants';
import RequestForm from './components/RequestForm';
import SuccessScreen from './components/SuccessScreen';
import AdminDashboard from './components/AdminDashboard';
import DailyReportForm from './components/DailyReportForm';
import DailyReportAdmin from './components/DailyReportAdmin';
import './App.css';

export default function App() {
  const [lang, setLang] = useState('en');
  const [view, setView] = useState('form'); // 'form'|'success'|'report'|'reportSuccess'|'admin'
  const [lastSubmission, setLastSubmission] = useState(null);
  const [lastReport, setLastReport] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);
  const [adminTab, setAdminTab] = useState('requests'); // 'requests'|'reports'

  const t = LANG[lang];

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

  const pageTitle =
    view === 'admin' ? t.adminTitle
    : view === 'report' || view === 'reportSuccess' ? t.reportTitle
    : view === 'success' ? t.successTitle
    : t.formTitle;

  const pageSub =
    view === 'admin' ? t.adminSub
    : view === 'report' ? t.reportSub
    : view === 'success' || view === 'reportSuccess' ? ''
    : t.formSub;

  const isFormActive = view !== 'admin' && view !== 'report' && view !== 'reportSuccess';
  const isReportActive = view === 'report' || view === 'reportSuccess';

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
        <div className="pageHeader">
          <h1 className="pageTitle">{pageTitle}</h1>
          {pageSub && <p className="pageSub">{pageSub}</p>}
        </div>
        <nav className="nav">
          <button className={"navBtn" + (isFormActive ? ' navActive' : '')} onClick={() => goTo('form')}>
            {t.navForm}
          </button>
          <button className={"navBtn" + (isReportActive ? ' navActive' : '')} onClick={() => goTo('report')}>
            {t.navReport}
          </button>
          <button className={"navBtn" + (view === 'admin' ? ' navActive' : '')} onClick={() => goTo('admin')}>
            {t.navAdmin}
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'form' && (
          <RequestForm lang={t} onSubmitted={handleSubmitted} />
        )}
        {view === 'success' && lastSubmission && (
          <SuccessScreen lang={t} submission={lastSubmission} onReset={() => goTo('form')} />
        )}
        {view === 'report' && (
          <DailyReportForm onSubmitted={handleReportSubmitted} />
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
        {view === 'admin' && (
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
            </div>
            {adminTab === 'requests' && <AdminDashboard lang={t} refreshKey={refreshKey} />}
            {adminTab === 'reports'  && <DailyReportAdmin refreshKey={reportRefreshKey} />}
          </div>
        )}
      </main>
    </div>
  );
}
