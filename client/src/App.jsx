import React, { useState } from 'react';
import { LANG } from './constants';
import RequestForm from './components/RequestForm';
import SuccessScreen from './components/SuccessScreen';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

export default function App() {
  const [lang, setLang] = useState('en');
  const [view, setView] = useState('form');
  const [lastSubmission, setLastSubmission] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const t = LANG[lang];

  const handleSubmitted = (submission) => {
    setLastSubmission(submission);
    setRefreshKey(k => k + 1);
    setView('success');
  };

  const goTo = (v) => {
    setView(v);
    if (v !== 'success') setLastSubmission(null);
  };

  const pageTitle = view === 'admin' ? t.adminTitle
    : view === 'success' ? t.successTitle
    : t.formTitle;

  const pageSub = view === 'admin' ? t.adminSub
    : view === 'success' ? ''
    : t.formSub;

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
          <button className={"navBtn" + (view !== 'admin' ? ' navActive' : '')} onClick={() => goTo('form')}>
            {t.navForm}
          </button>
          <button className={"navBtn" + (view === 'admin' ? ' navActive' : '')} onClick={() => goTo('admin')}>
            {t.navAdmin}
          </button>
        </nav>
      </header>
      <main className="main">
        {view === 'form'    && <RequestForm lang={t} onSubmitted={handleSubmitted} />}
        {view === 'success' && lastSubmission && <SuccessScreen lang={t} submission={lastSubmission} onReset={() => goTo('form')} />}
        {view === 'admin'   && <AdminDashboard lang={t} refreshKey={refreshKey} />}
      </main>
    </div>
  );
}
