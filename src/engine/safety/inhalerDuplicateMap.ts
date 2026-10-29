/**
 * GDMT-VN Safety - Inhaler Combination Decomposition & Class Expansion Helpers
 * Phân quyền: Agent B
 */

import { hasDrug, drug } from '../../kb-types';
import { getNormalizedDrugClasses, resolveKbDrugId } from './drugClassify';
import { expandDrugComponents } from './fdcMap';

export interface InhalerDecomposition {
  brandOrName: string;
  classes: ('lama' | 'laba' | 'ics' | 'saba' | 'sama')[];
  components: string[];
}

export const INHALER_COMBINATIONS: Record<string, InhalerDecomposition> = {
  spiolto: { brandOrName: 'Spiolto (Tiotropium + Olodaterol)', classes: ['lama', 'laba'], components: ['tiotropium', 'olodaterol'] },
  tiotropium_olodaterol: { brandOrName: 'Tiotropium + Olodaterol (Spiolto)', classes: ['lama', 'laba'], components: ['tiotropium', 'olodaterol'] },
  ultibro: { brandOrName: 'Ultibro (Glycopyrronium + Indacaterol)', classes: ['lama', 'laba'], components: ['glycopyrronium', 'indacaterol'] },
  glycopyrronium_indacaterol: { brandOrName: 'Glycopyrronium + Indacaterol (Ultibro)', classes: ['lama', 'laba'], components: ['glycopyrronium', 'indacaterol'] },
  indacaterol_glycopyrronium: { brandOrName: 'Indacaterol + Glycopyrronium (Ultibro)', classes: ['lama', 'laba'], components: ['glycopyrronium', 'indacaterol'] },
  anoro: { brandOrName: 'Anoro (Umeclidinium + Vilanterol)', classes: ['lama', 'laba'], components: ['umeclidinium', 'vilanterol'] },
  umeclidinium_vilanterol: { brandOrName: 'Umeclidinium + Vilanterol (Anoro)', classes: ['lama', 'laba'], components: ['umeclidinium', 'vilanterol'] },
  duaklir: { brandOrName: 'Duaklir (Aclidinium + Formoterol)', classes: ['lama', 'laba'], components: ['aclidinium', 'formoterol'] },
  aclidinium_formoterol: { brandOrName: 'Aclidinium + Formoterol (Duaklir)', classes: ['lama', 'laba'], components: ['aclidinium', 'formoterol'] },
  bevespi: { brandOrName: 'Bevespi (Glycopyrronium + Formoterol)', classes: ['lama', 'laba'], components: ['glycopyrronium', 'formoterol'] },
  glycopyrronium_formoterol: { brandOrName: 'Glycopyrronium + Formoterol (Bevespi)', classes: ['lama', 'laba'], components: ['glycopyrronium', 'formoterol'] },

  symbicort: { brandOrName: 'Symbicort (Budesonide + Formoterol)', classes: ['ics', 'laba'], components: ['budesonide', 'formoterol'] },
  budesonide_formoterol: { brandOrName: 'Budesonide + Formoterol (Symbicort)', classes: ['ics', 'laba'], components: ['budesonide', 'formoterol'] },
  seretide: { brandOrName: 'Seretide (Fluticasone + Salmeterol)', classes: ['ics', 'laba'], components: ['fluticasone_propionate', 'salmeterol'] },
  fluticasone_salmeterol: { brandOrName: 'Fluticasone + Salmeterol (Seretide)', classes: ['ics', 'laba'], components: ['fluticasone_propionate', 'salmeterol'] },
  relvar: { brandOrName: 'Relvar (Fluticasone furoate + Vilanterol)', classes: ['ics', 'laba'], components: ['fluticasone_furoate', 'vilanterol'] },
  fluticasone_vilanterol: { brandOrName: 'Fluticasone furoate + Vilanterol (Relvar)', classes: ['ics', 'laba'], components: ['fluticasone_furoate', 'vilanterol'] },
  foster: { brandOrName: 'Foster (Beclometasone + Formoterol)', classes: ['ics', 'laba'], components: ['beclometasone', 'formoterol'] },
  beclometasone_formoterol: { brandOrName: 'Beclometasone + Formoterol (Foster)', classes: ['ics', 'laba'], components: ['beclometasone', 'formoterol'] },
  dulera: { brandOrName: 'Dulera (Mometasone + Formoterol)', classes: ['ics', 'laba'], components: ['mometasone', 'formoterol'] },
  mometasone_formoterol: { brandOrName: 'Mometasone + Formoterol (Dulera)', classes: ['ics', 'laba'], components: ['mometasone', 'formoterol'] },
  flutiform: { brandOrName: 'Flutiform (Fluticasone + Formoterol)', classes: ['ics', 'laba'], components: ['fluticasone_propionate', 'formoterol'] },
  fluticasone_formoterol: { brandOrName: 'Fluticasone + Formoterol (Flutiform)', classes: ['ics', 'laba'], components: ['fluticasone_propionate', 'formoterol'] },

  trelegy: { brandOrName: 'Trelegy (Fluticasone + Umeclidinium + Vilanterol)', classes: ['ics', 'lama', 'laba'], components: ['fluticasone_furoate', 'umeclidinium', 'vilanterol'] },
  fluticasone_furoate_umeclidinium_vilanterol: { brandOrName: 'Fluticasone furoate + Umeclidinium + Vilanterol (Trelegy)', classes: ['ics', 'lama', 'laba'], components: ['fluticasone_furoate', 'umeclidinium', 'vilanterol'] },
  fluticasone_umeclidinium_vilanterol: { brandOrName: 'Fluticasone + Umeclidinium + Vilanterol (Trelegy)', classes: ['ics', 'lama', 'laba'], components: ['fluticasone_furoate', 'umeclidinium', 'vilanterol'] },
  trimbow: { brandOrName: 'Trimbow (Beclometasone + Glycopyrronium + Formoterol)', classes: ['ics', 'lama', 'laba'], components: ['beclometasone', 'glycopyrronium', 'formoterol'] },
  beclometasone_glycopyrronium_formoterol: { brandOrName: 'Beclometasone + Glycopyrronium + Formoterol (Trimbow)', classes: ['ics', 'lama', 'laba'], components: ['beclometasone', 'glycopyrronium', 'formoterol'] },
  beclometasone_formoterol_glycopyrronium: { brandOrName: 'Beclometasone + Formoterol + Glycopyrronium (Trimbow)', classes: ['ics', 'lama', 'laba'], components: ['beclometasone', 'formoterol', 'glycopyrronium'] },
  budesonide_glycopyrronium_formoterol: { brandOrName: 'Budesonide + Glycopyrronium + Formoterol (Breztri)', classes: ['ics', 'lama', 'laba'], components: ['budesonide', 'glycopyrronium', 'formoterol'] },
  budesonide_formoterol_glycopyrronium: { brandOrName: 'Budesonide + Formoterol + Glycopyrronium (Breztri)', classes: ['ics', 'lama', 'laba'], components: ['budesonide', 'formoterol', 'glycopyrronium'] },
  breztri: { brandOrName: 'Breztri (Budesonide + Glycopyrronium + Formoterol)', classes: ['ics', 'lama', 'laba'], components: ['budesonide', 'glycopyrronium', 'formoterol'] },
  trixeo: { brandOrName: 'Trixeo (Budesonide + Glycopyrronium + Formoterol)', classes: ['ics', 'lama', 'laba'], components: ['budesonide', 'glycopyrronium', 'formoterol'] },
  enerzair: { brandOrName: 'Enerzair (Mometasone + Glycopyrronium + Indacaterol)', classes: ['ics', 'lama', 'laba'], components: ['mometasone', 'glycopyrronium', 'indacaterol'] },
  indacaterol_glycopyrronium_mometasone: { brandOrName: 'Indacaterol + Glycopyrronium + Mometasone (Enerzair)', classes: ['ics', 'lama', 'laba'], components: ['indacaterol', 'glycopyrronium', 'mometasone'] },

  combivent: { brandOrName: 'Combivent (Ipratropium + Salbutamol)', classes: ['sama', 'saba'], components: ['ipratropium', 'salbutamol'] },
  ipratropium_salbutamol: { brandOrName: 'Ipratropium + Salbutamol (Combivent)', classes: ['sama', 'saba'], components: ['ipratropium', 'salbutamol'] },
  berodual: { brandOrName: 'Berodual (Ipratropium + Fenoterol)', classes: ['sama', 'saba'], components: ['ipratropium', 'fenoterol'] },
  ipratropium_fenoterol: { brandOrName: 'Ipratropium + Fenoterol (Berodual)', classes: ['sama', 'saba'], components: ['ipratropium', 'fenoterol'] }
};

export const SINGLE_INHALERS: Record<string, { class: 'lama' | 'laba' | 'ics' | 'saba' | 'sama'; nameVi: string }> = {
  tiotropium: { class: 'lama', nameVi: 'Tiotropium (Spiriva)' },
  umeclidinium: { class: 'lama', nameVi: 'Umeclidinium (Incruse)' },
  glycopyrronium: { class: 'lama', nameVi: 'Glycopyrronium (Seebri)' },
  aclidinium: { class: 'lama', nameVi: 'Aclidinium' },
  salmeterol: { class: 'laba', nameVi: 'Salmeterol (Serevent)' },
  formoterol: { class: 'laba', nameVi: 'Formoterol (Foradil)' },
  indacaterol: { class: 'laba', nameVi: 'Indacaterol (Onbrez)' },
  olodaterol: { class: 'laba', nameVi: 'Olodaterol (Striverdi)' },
  vilanterol: { class: 'laba', nameVi: 'Vilanterol' },
  budesonide: { class: 'ics', nameVi: 'Budesonide (Pulmicort)' },
  fluticasone: { class: 'ics', nameVi: 'Fluticasone (Flixotide)' },
  fluticasone_propionate: { class: 'ics', nameVi: 'Fluticasone propionate (Flixotide)' },
  fluticasone_furoate: { class: 'ics', nameVi: 'Fluticasone furoate (Arnuity)' },
  beclometasone: { class: 'ics', nameVi: 'Beclometasone' },
  mometasone: { class: 'ics', nameVi: 'Mometasone' },
  ciclesonide: { class: 'ics', nameVi: 'Ciclesonide (Alvesco)' },
  salbutamol: { class: 'saba', nameVi: 'Salbutamol (Ventolin)' },
  terbutaline: { class: 'saba', nameVi: 'Terbutaline (Bricanyl)' },
  fenoterol: { class: 'saba', nameVi: 'Fenoterol' },
  ipratropium: { class: 'sama', nameVi: 'Ipratropium (Atrovent)' }
};

export function getExpandedDuplicateClasses(drugId: string): { label: string; classes: Set<string> } {
  const id = (drugId || '').trim().toLowerCase();
  const classes = getNormalizedDrugClasses(id);
  let label = id;

  const combo = INHALER_COMBINATIONS[id];
  if (combo) {
    label = combo.brandOrName;
    for (const c of combo.classes) classes.add(c);
  }

  const single = SINGLE_INHALERS[id];
  if (single) {
    if (label === id) label = single.nameVi;
    classes.add(single.class);
  }

  const resolved = resolveKbDrugId(id);
  if (INHALER_COMBINATIONS[resolved] && label === id) {
    label = INHALER_COMBINATIONS[resolved].brandOrName;
    for (const c of INHALER_COMBINATIONS[resolved].classes) classes.add(c);
  }

  if (hasDrug(resolved)) {
    const d = drug(resolved);
    if (d.nameVi && label === id) label = d.nameVi;
    const rawClass = (d.class || '').toLowerCase();
    if (/\blama\b/.test(rawClass)) classes.add('lama');
    if (/\blaba\b/.test(rawClass)) classes.add('laba');
    if (/\bics\b/.test(rawClass)) classes.add('ics');
    if (/\bsaba\b/.test(rawClass)) classes.add('saba');
    if (/\bsama\b/.test(rawClass)) classes.add('sama');
  }

  for (const comp of expandDrugComponents(id)) {
    const compLower = comp.toLowerCase();
    if (SINGLE_INHALERS[compLower]) classes.add(SINGLE_INHALERS[compLower].class);
    for (const subC of getNormalizedDrugClasses(compLower)) {
      classes.add(subC);
    }
  }

  return { label, classes };
}

export function isMaintenanceInhalerClasses(classes: Set<string>): boolean {
  return classes.has('laba') || classes.has('lama') || classes.has('ics');
}
