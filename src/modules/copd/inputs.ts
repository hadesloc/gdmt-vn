import type { ModuleInputSchema } from '../../engine/types';
import { copdStableInputGroups } from './inputs.stable';
import { copdAcuteInputGroups } from './inputs.acute';

export const copdInputs: ModuleInputSchema = {
  groups: [...copdStableInputGroups, ...copdAcuteInputGroups],
};
