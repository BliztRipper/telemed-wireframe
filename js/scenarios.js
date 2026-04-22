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
      { name: 'HbA1c', unit: '%', values: [7.2, 7.0, 6.8], abnormal: false, arrow: '↓' },
      { name: 'FBS',   unit: 'mg/dL', values: [142, 138, 130], abnormal: false, arrow: '↓' }
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
    syncOutcome: { his: 'ok', pharmacy: 'ok', lab: 'ok', nhso: 'ok', er: null }
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
      { name: 'Troponin I', unit: 'ng/mL', values: [0.02, 0.15, 0.8], abnormal: true, arrow: '↑' },
      { name: 'BNP',        unit: 'pg/mL', values: [120, 340, 890], abnormal: true, arrow: '↑' },
      { name: 'Creatinine', unit: 'mg/dL', values: [1.1, 1.2, 1.3], abnormal: false, arrow: '→' }
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
    syncOutcome: { his: 'ok', pharmacy: 'ok', lab: 'ok', nhso: 'ok', er: 'ok' }
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
      { name: 'Creatinine', unit: 'mg/dL', values: [1.0, 1.0, 1.0], abnormal: false, arrow: '→' },
      { name: 'K+',         unit: 'mmol/L', values: [4.2, 4.1, 4.0], abnormal: false, arrow: '→' }
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
    syncOutcome: { his: 'ok', pharmacy: 'fail', lab: 'ok', nhso: 'ok', er: null }
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
      { name: 'Creatinine', unit: 'mg/dL', values: [1.0, 1.0, 1.0], abnormal: false, arrow: '→' }
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
