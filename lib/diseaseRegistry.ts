export type DiseaseId = 'htn' | 't2dm' | 'dyslipidemia' | 'other';

export type DiseaseConfig = {
  id: DiseaseId;
  display_name: string;
  icd_codes: string[];
  diagnosis_name_aliases: string[];
  citation: string;
  fallback_message_en: Record<string, string>;
};

export const DISEASE_REGISTRY: Record<DiseaseId, DiseaseConfig> = {
  htn: {
    id: 'htn',
    display_name: 'Hypertension',
    icd_codes: ['I10', 'I11', 'I12', 'I13', 'I15'],
    diagnosis_name_aliases: ['Hypertension', 'Essential Hypertension', 'High BP', 'HTN'],
    citation: 'ICMR HTN 2018',
    fallback_message_en: {
      bp_threshold_breach: "Hi {first_name}, I noticed your BP has been higher than usual recently. Could you take it again in the morning before food and share the reading?",
      adherence_gap_critical: "Hi {first_name}, I noticed a couple of missed BP medication doses. Please try not to skip them — would you like me to set a daily reminder?",
      multi_factor_pattern: "Hi {first_name}, your recent readings have me a little worried. Let's set up a quick call with Dr. Mehta this week.",
      symptom_cluster: "Hi {first_name}, you've shared a few symptoms this week. Please rest and let me know if anything gets worse — Dr. Mehta has been informed.",
      spo2_drop: "Hi {first_name}, your oxygen reading was lower than expected. Please measure again after a few minutes of sitting calmly and share the value."
    }
  },
  t2dm: {
    id: 't2dm',
    display_name: 'Type 2 Diabetes',
    icd_codes: ['E11'],
    diagnosis_name_aliases: ['Type 2 Diabetes', 'Type 2 Diabetes Mellitus', 'Diabetes', 'T2DM', 'Diabetes Mellitus'],
    citation: 'RSSDI 2022',
    fallback_message_en: {
      glucose_excursion: "Hi {first_name}, your sugar readings have been on the higher side this week. Please drink water, avoid sweets today, and take your next reading before lunch.",
      adherence_gap_critical: "Hi {first_name}, I see you've missed a couple of diabetes medication doses. Could you take it now if it's still close to the right time?",
      multi_factor_pattern: "Hi {first_name}, your sugar and BP both need attention. Let's get on a quick call with Dr. Mehta this week.",
      symptom_cluster: "Hi {first_name}, the symptoms you've shared can sometimes be linked to your sugar. Please check your reading now if you can.",
      spo2_drop: "Hi {first_name}, your oxygen reading was a bit low. Please rest and recheck in 10 minutes."
    }
  },
  dyslipidemia: {
    id: 'dyslipidemia',
    display_name: 'Dyslipidemia',
    icd_codes: ['E78'],
    diagnosis_name_aliases: ['Dyslipidemia', 'High cholesterol', 'Hyperlipidemia'],
    citation: 'LAI 2022',
    fallback_message_en: {
      adherence_gap_critical: "Hi {first_name}, please remember your cholesterol tablet at night — it's most effective when taken regularly.",
      multi_factor_pattern: "Hi {first_name}, given your full picture, please be careful with diet this week and book a clinic visit soon."
    }
  },
  other: {
    id: 'other',
    display_name: 'Other condition',
    icd_codes: [],
    diagnosis_name_aliases: [],
    citation: 'clinician guidance',
    fallback_message_en: {}
  }
};

export const DRUG_TO_DISEASE: Record<string, DiseaseId> = {
  amlodipine: 'htn',
  telmisartan: 'htn',
  losartan: 'htn',
  ramipril: 'htn',
  enalapril: 'htn',
  metoprolol: 'htn',
  atenolol: 'htn',
  metformin: 't2dm',
  glimepiride: 't2dm',
  sitagliptin: 't2dm',
  empagliflozin: 't2dm',
  insulin: 't2dm',
  atorvastatin: 'dyslipidemia',
  rosuvastatin: 'dyslipidemia',
  simvastatin: 'dyslipidemia',
  ezetimibe: 'dyslipidemia'
};

export function lookupDrugDisease(drugName: string | null | undefined): DiseaseId | null {
  if (!drugName) return null;
  const key = drugName.trim().toLowerCase().split(/\s+/)[0];
  return DRUG_TO_DISEASE[key] ?? null;
}

export function resolveDiseaseId(diagnosisName: string | null | undefined, icdCode: string | null | undefined): DiseaseId {
  const name = (diagnosisName || '').trim();
  const icd = (icdCode || '').trim();
  for (const cfg of Object.values(DISEASE_REGISTRY)) {
    if (cfg.id === 'other') continue;
    if (name && cfg.diagnosis_name_aliases.some(a => a.toLowerCase() === name.toLowerCase())) return cfg.id;
    if (icd && cfg.icd_codes.some(prefix => icd.toUpperCase().startsWith(prefix))) return cfg.id;
  }
  return 'other';
}

export function getDiseaseDisplayName(id: DiseaseId | string | null | undefined): string {
  if (!id) return 'Other';
  const cfg = (DISEASE_REGISTRY as any)[id];
  return cfg?.display_name || 'Other';
}

export function getCitationFor(diseaseId: DiseaseId | null): string {
  if (!diseaseId) return 'clinician guidance';
  return DISEASE_REGISTRY[diseaseId]?.citation || 'clinician guidance';
}

export function getFallbackMessageEn(diseaseId: DiseaseId | null, eventType: string, firstName: string): string {
  const cfg = diseaseId ? DISEASE_REGISTRY[diseaseId] : null;
  const tpl = cfg?.fallback_message_en?.[eventType]
    || `Hi ${firstName}, your readings need a quick check. Dr. Mehta has been notified.`;
  return tpl.replace(/\{first_name\}/g, firstName || 'there');
}
