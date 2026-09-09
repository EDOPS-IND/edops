import { csrfSync } from 'csrf-sync';

export const csrf = csrfSync({ size: 32 });
