/**
 * GDMT-VN Gout Module - Xanthine Oxidase Inhibitor (Allopurinol & Febuxostat) Barrel
 * Phân quyền: Agent K
 */

import type { Rule } from '../../engine/types';
import { goutAllopurinolRules } from './rules.ult.allopurinol';
import { goutFebuxostatRules } from './rules.ult.febuxostat';

export const goutUltRules: Rule[] = [...goutAllopurinolRules, ...goutFebuxostatRules];
