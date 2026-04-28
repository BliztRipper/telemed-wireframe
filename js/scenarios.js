export const identity = {
  doctor: { name: 'Dr. Somchai N.', id: 'D-00123' },
  nurse:  { name: 'Nurse Malee K.', id: 'N-00456' }
};

export const scenarios = {
  A: {
    id: 'A',
    patient: { name: 'Somchai K.', hn: '00123', age: 58, sex: 'M' },
    queueSeq: 2, waitingMin: 5, scheduledAt: '10:30',
    chiefComplaint: 'Follow-up diabetes, feeling fine.',
    reasonShort: 'T2DM 3-mo follow-up',
    allergy: [],
    vitals: { bp: '128/80', hr: 76, rr: 16, spo2: 98, temp: 36.8, takenAt: '10:25' },
    labs: [
      { name: 'HbA1c', unit: '%', values: [7.2, 7.0, 6.8], abnormal: false, arrow: '↓', receivedAt: '2026-04-22T07:30:00+07:00' },
      { name: 'FBS',   unit: 'mg/dL', values: [142, 138, 130], abnormal: false, arrow: '↓', receivedAt: '2026-04-22T07:30:00+07:00' }
    ],
    meds: [
      { name: 'Metformin', dose: '500mg', freq: 'BID' },
      { name: 'Atorvastatin', dose: '20mg', freq: 'OD' }
    ],
    redFlags: [],
    aiRisk: { score: 12, label: 'low', recommendation: 'Continue current plan.' },
    transcript: [
      { spk: 'Dr', text: 'How have you been feeling since last visit?', at: 1000 },
      { spk: 'Pt', text: 'Good, sugar has been stable.', at: 3000 },
      { spk: 'Dr', text: 'Any side effects from metformin?', at: 5000 },
      { spk: 'Pt', text: 'No, tolerating well.', at: 7000 }
    ],
    soapDraft: {
      s: '58M c/o routine follow-up, reports stable glycemic control.',
      o: 'Vitals stable. HbA1c 6.8% (improving). No acute complaints.',
      a: 'T2DM — well controlled on current regimen.',
      p: 'Continue metformin 500mg BID. Recheck HbA1c in 3 months.'
    },
    rxPrefilled: [
      { drug: 'Metformin', dose: '500mg', freq: 'BID', duration: '90 days', interaction: 'safe', allergyCheck: 'safe' }
    ],
    referral: { er: false, dept: 'None' },
    labPending: false,
    syncOutcome: { his: 'ok', pharmacy: 'ok', lab: 'ok', nhso: 'ok', er: null },
    history: {
      conditions: [
        { name: 'Type 2 Diabetes Mellitus', since: '2018-03', status: 'controlled on metformin' },
        { name: 'Dyslipidemia', since: '2019-07', status: 'LDL at goal' },
        { name: 'Mild knee osteoarthritis', since: '2022-05', status: 'PRN paracetamol' }
      ],
      surgeries: [
        { name: 'Appendectomy', date: '1995-06', note: 'open, uneventful recovery' }
      ],
      medications: [
        { name: 'Metformin 500mg BID', start: '2020-08', stop: null, reason: 'first-line T2DM' },
        { name: 'Atorvastatin 20mg OD', start: '2019-07', stop: null, reason: 'dyslipidemia' },
        { name: 'Glibenclamide 5mg OD', start: '2018-03', stop: '2020-08', reason: 'switched — hypoglycemic episodes' }
      ],
      symptoms: [
        { date: '2026-04-15', note: 'Mild afternoon fatigue, self-resolved' },
        { date: '2026-01-08', note: 'Transient polyuria during URI, resolved with hydration' },
        { date: '2025-09-22', note: 'No symptoms — routine review' }
      ],
      visits: [
        { date: '2026-01-22', dept: 'OPD-Endocrine', note: 'HbA1c 7.0%, dose unchanged' },
        { date: '2025-10-20', dept: 'OPD-Endocrine', note: 'Foot exam clean, retinal screen normal' },
        { date: '2025-07-18', dept: 'OPD-Endocrine', note: 'HbA1c 7.2%, reinforced diet' }
      ],
      family: 'Father — T2DM (dx age 55). Mother — HTN.',
      social: 'Retired teacher. Non-smoker. Social alcohol (1–2 drinks/wk). Walks 30 min daily.',
      immunizations: [
        { name: 'Influenza', date: '2025-10' },
        { name: 'COVID-19 booster', date: '2025-04' },
        { name: 'Pneumococcal (PPSV23)', date: '2024-03' }
      ]
    }
  },
  B: {
    id: 'B',
    patient: { name: 'Malee P.', hn: '00456', age: 67, sex: 'F' },
    queueSeq: 1, waitingMin: 12, scheduledAt: '02:15',
    chiefComplaint: 'Chest tightness for 2 hours, worse on exertion.',
    reasonShort: 'CHF + new chest pain',
    allergy: [
      { drug: 'Penicillin', reaction: 'rash' },
      { drug: 'Sulfa', reaction: 'mild' }
    ],
    vitals: { bp: '156/94', hr: 128, rr: 22, spo2: 89, temp: 37.1, takenAt: '09:42' },
    labs: [
      { name: 'Troponin I', unit: 'ng/mL', values: [0.02, 0.15, 0.8], abnormal: true, arrow: '↑', receivedAt: '2026-04-22T09:30:00+07:00' },
      { name: 'BNP',        unit: 'pg/mL', values: [120, 340, 890], abnormal: true, arrow: '↑', receivedAt: '2026-04-22T09:45:00+07:00' },
      { name: 'Creatinine', unit: 'mg/dL', values: [1.1, 1.2, 1.3], abnormal: false, arrow: '→', receivedAt: '2026-04-22T08:15:00+07:00' }
    ],
    meds: [
      { name: 'Furosemide', dose: '40mg', freq: 'BID' },
      { name: 'Enalapril',  dose: '10mg', freq: 'BID' },
      { name: 'Aspirin',    dose: '81mg', freq: 'OD' }
    ],
    redFlags: [
      { source: 'auto', label: 'HR 128', threshold: '>120' },
      { source: 'auto', label: 'SpO2 89%', threshold: '<92' },
      { source: 'auto', label: 'Troponin 0.8↑', threshold: 'trending up' }
    ],
    aiRisk: { score: 72, label: 'high', recommendation: 'Suspect ACS. ECG stat + cardiology referral + ER escalation.' },
    transcript: [
      { spk: 'Dr', text: 'How long has the chest pain been going on?', at: 1000 },
      { spk: 'Pt', text: 'Started two hours ago, getting worse.', at: 3000 },
      { spk: 'Dr', text: 'Any pain radiating to your arm or jaw?', at: 5000 },
      { spk: 'Pt', text: 'Yes, left arm feels heavy.', at: 7000 },
      { spk: 'Dr', text: 'I am sending you to the ER immediately.', at: 9000 }
    ],
    soapDraft: {
      s: '67F c/o 2h chest tightness worse on exertion, L arm heaviness.',
      o: 'HR 128, SpO2 89%, Troponin I 0.8 (rising), BNP 890.',
      a: 'Acute coronary syndrome, rule out STEMI.',
      p: 'ECG stat. Aspirin 300mg chew. Nitroglycerin SL PRN. ER escalation + cardiology follow-up.'
    },
    rxPrefilled: [
      { drug: 'Aspirin', dose: '300mg', freq: 'Stat', duration: '1 dose', interaction: 'safe', allergyCheck: 'safe' },
      { drug: 'Nitroglycerin SL', dose: '0.4mg', freq: 'PRN', duration: '1 day', interaction: 'caution', interactionNote: 'caution w/ enalapril (monitor BP)', allergyCheck: 'safe' }
    ],
    referral: { er: true, dept: 'Cardiology' },
    labPending: false,
    syncOutcome: { his: 'ok', pharmacy: 'ok', lab: 'ok', nhso: 'ok', er: 'ok' },
    history: {
      conditions: [
        { name: 'Congestive Heart Failure (HFrEF, EF 35%)', since: '2021-02', status: 'on diuretic + ACEi' },
        { name: 'Prior anterior STEMI', since: '2019-08', status: 's/p PCI to LAD with DES' },
        { name: 'Hypertension', since: '2010-04', status: 'controlled' },
        { name: 'Paroxysmal atrial fibrillation', since: '2022-11', status: 'rate-controlled' },
        { name: 'CKD stage 2', since: '2023-06', status: 'eGFR 68' }
      ],
      surgeries: [
        { name: 'PCI + DES to LAD', date: '2019-08', note: 'post-STEMI, no complications' },
        { name: 'Cataract extraction OD', date: '2023-04', note: 'phacoemulsification, uneventful' }
      ],
      medications: [
        { name: 'Furosemide 40mg BID', start: '2021-02', stop: null, reason: 'HFrEF — volume control' },
        { name: 'Enalapril 10mg BID', start: '2022-01', stop: null, reason: 'replaced atenolol — better LV remodeling' },
        { name: 'Aspirin 81mg OD', start: '2019-08', stop: null, reason: 'post-PCI secondary prevention' },
        { name: 'Atenolol 50mg OD', start: '2019-09', stop: '2022-01', reason: 'switched to ACEi for HFrEF' },
        { name: 'Clopidogrel 75mg OD', start: '2019-08', stop: '2020-08', reason: 'completed 12-mo DAPT' }
      ],
      symptoms: [
        { date: '2026-04-28', note: 'TODAY — 2h chest tightness, worse on exertion, L-arm heaviness' },
        { date: '2026-04-25', note: 'Bilateral leg edema +1, mild orthopnea (1 extra pillow)' },
        { date: '2026-04-20', note: 'Dyspnea on stair climbing, NYHA II' },
        { date: '2026-03-12', note: 'Stable, no chest pain' }
      ],
      visits: [
        { date: '2026-03-12', dept: 'OPD-Cardiology', note: 'Echo EF 35% (stable). Up-titrated furosemide.' },
        { date: '2025-12-04', dept: 'OPD-Cardiology', note: 'Holter 24h — rare PACs, no sustained AF' },
        { date: '2025-09-08', dept: 'OPD-Cardiology', note: 'BNP 320, mild congestion. Diet review.' }
      ],
      family: 'Father — fatal MI age 60. Brother — CABG age 58.',
      social: 'Retired civil servant. Ex-smoker (quit 2019, 30 pack-years). No alcohol. Sedentary since CHF dx.',
      immunizations: [
        { name: 'Influenza', date: '2025-10' },
        { name: 'COVID-19 booster', date: '2025-04' },
        { name: 'Pneumococcal (PCV13 + PPSV23)', date: '2023-09' }
      ]
    }
  },
  C: {
    id: 'C',
    patient: { name: 'Anan R.', hn: '00789', age: 45, sex: 'M' },
    queueSeq: 3, waitingMin: 2, scheduledAt: '10:45',
    chiefComplaint: 'Routine BP check, no new symptoms.',
    reasonShort: 'HTN check',
    allergy: [],
    vitals: { bp: '134/84', hr: 72, rr: 14, spo2: 98, temp: 36.7, takenAt: '10:40' },
    labs: [
      { name: 'Creatinine', unit: 'mg/dL', values: [1.0, 1.0, 1.0], abnormal: false, arrow: '→', receivedAt: '2026-04-22T08:00:00+07:00' },
      { name: 'K+',         unit: 'mmol/L', values: [4.2, 4.1, 4.0], abnormal: false, arrow: '→', receivedAt: '2026-04-22T08:00:00+07:00' }
    ],
    meds: [ { name: 'Amlodipine', dose: '5mg', freq: 'OD' } ],
    redFlags: [],
    aiRisk: { score: 18, label: 'low', recommendation: 'Continue current plan.' },
    transcript: [
      { spk: 'Dr', text: 'Any new symptoms since last check?', at: 1000 },
      { spk: 'Pt', text: 'None. Taking medicine as prescribed.', at: 3000 },
      { spk: 'Dr', text: 'Home BP readings?', at: 5000 },
      { spk: 'Pt', text: 'Around 130 over 80, consistently.', at: 7000 }
    ],
    soapDraft: {
      s: '45M c/o routine HTN follow-up, asymptomatic.',
      o: 'BP 134/84 in clinic. Home BP ~130/80. Labs stable.',
      a: 'HTN — controlled on amlodipine.',
      p: 'Continue amlodipine 5mg OD. Recheck in 3 months.'
    },
    rxPrefilled: [
      { drug: 'Amlodipine', dose: '5mg', freq: 'OD', duration: '90 days', interaction: 'safe', allergyCheck: 'safe' }
    ],
    referral: { er: false, dept: 'None' },
    labPending: true,
    syncOutcome: { his: 'ok', pharmacy: { result: 'fail', code: 'ERR-503', reason: 'pharmacy offline' }, lab: 'ok', nhso: 'ok', er: null },
    history: {
      conditions: [
        { name: 'Essential Hypertension', since: '2022-06', status: 'controlled on amlodipine' },
        { name: 'Overweight (BMI 27.4)', since: '2022-06', status: 'lifestyle counselling' }
      ],
      surgeries: [],
      medications: [
        { name: 'Amlodipine 5mg OD', start: '2024-02', stop: null, reason: 'switched from HCTZ' },
        { name: 'Hydrochlorothiazide 25mg OD', start: '2022-06', stop: '2024-02', reason: 'discontinued — leg cramps' }
      ],
      symptoms: [
        { date: '2026-04-15', note: 'Asymptomatic — home BP ~130/80' },
        { date: '2026-01-12', note: 'Occasional headaches, resolved with hydration' }
      ],
      visits: [
        { date: '2026-01-22', dept: 'OPD-Internal Medicine', note: 'BP 132/82, labs stable' },
        { date: '2025-10-14', dept: 'OPD-Internal Medicine', note: 'Annual review — no end-organ damage' }
      ],
      family: 'Both parents — HTN. No early CV deaths.',
      social: 'Accountant. Non-smoker. Occasional alcohol (1 drink/wk). Sedentary, weekend cycling.',
      immunizations: [
        { name: 'Influenza', date: '2025-11' },
        { name: 'COVID-19 booster', date: '2024-10' }
      ]
    }
  },
  D: {
    id: 'D',
    patient: { name: 'Prasit L.', hn: '00234', age: 52, sex: 'M' },
    queueSeq: 0, waitingMin: 0, scheduledAt: '09:00',
    chiefComplaint: 'HTN follow-up, completed.',
    reasonShort: 'HTN follow-up',
    allergy: [],
    vitals: { bp: '124/78', hr: 72, rr: 15, spo2: 99, temp: 36.6, takenAt: '08:50' },
    labs: [
      { name: 'Creatinine', unit: 'mg/dL', values: [1.0, 1.0, 1.0], abnormal: false, arrow: '→', receivedAt: '2026-04-22T07:15:00+07:00' }
    ],
    meds: [ { name: 'Losartan', dose: '50mg', freq: 'OD' } ],
    redFlags: [],
    aiRisk: { score: 10, label: 'low', recommendation: 'Continue plan.' },
    transcript: [],
    soapDraft: { s: 'Stable HTN.', o: 'BP 124/78.', a: 'HTN controlled.', p: 'Continue Losartan.' },
    rxPrefilled: [],
    referral: { er: false, dept: 'None' },
    labPending: false,
    syncOutcome: { his: 'ok', pharmacy: 'ok', lab: 'ok', nhso: 'ok', er: null }
  },
  E: {
    id: 'E',
    patient: { name: 'Nadia M.', hn: '00345', age: 34, sex: 'F' },
    queueSeq: 0, waitingMin: 0, scheduledAt: '09:30',
    chiefComplaint: 'Migraine follow-up, completed.',
    reasonShort: 'Migraine follow-up',
    allergy: [ { drug: 'Ibuprofen', reaction: 'GI upset' } ],
    vitals: { bp: '118/74', hr: 68, rr: 14, spo2: 99, temp: 36.5, takenAt: '09:20' },
    labs: [],
    meds: [ { name: 'Sumatriptan', dose: '50mg', freq: 'PRN' } ],
    redFlags: [],
    aiRisk: { score: 8, label: 'low', recommendation: 'Continue plan.' },
    transcript: [],
    soapDraft: { s: 'Migraine stable.', o: 'No aura.', a: 'Chronic migraine.', p: 'Continue PRN sumatriptan.' },
    rxPrefilled: [],
    referral: { er: false, dept: 'None' },
    labPending: false,
    syncOutcome: { his: 'ok', pharmacy: 'ok', lab: 'ok', nhso: 'ok', er: null }
  }
};
