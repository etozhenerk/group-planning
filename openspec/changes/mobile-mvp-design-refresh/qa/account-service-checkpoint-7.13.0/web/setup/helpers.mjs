// Shared QA tools only; importing performs no browser/API/build work.
export { frozen, finish, launch, login, api, capture, failOnce, check, writeJSON } from '../../../vibe-checkpoint-7.13.0/web/setup/harness.mjs';
export const profileFixtures = Object.freeze({ full: 'Профиль: все поля', partial: 'Профиль: неполная дата', clear: 'Профиль: очищение', publicPeer: 'Лена', neutralFallback: 'Катя' });
