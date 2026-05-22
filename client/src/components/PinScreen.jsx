import React, { useState } from 'react';
import styles from './PinScreen.module.css';

export default function PinScreen({ lang, onUnlock, onBack }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === import.meta.env.VITE_ADMIN_PIN) {
      setError('');
      onUnlock();
    } else {
      setError(lang.pinError);
      setPin('');
    }
  };

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.title}>{lang.pinTitle}</h2>
        <input
          className={styles.input}
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder={lang.pinPlaceholder}
          autoFocus
          autoComplete="off"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} type="submit">{lang.pinUnlock}</button>
        <button className={styles.backLink} type="button" onClick={onBack}>
          {lang.pinBack}
        </button>
      </form>
    </div>
  );
}
