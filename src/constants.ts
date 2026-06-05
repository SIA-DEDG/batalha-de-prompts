export const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE as string;
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;
export const IS_DEV = new URLSearchParams(window.location.search).has('dev');
export const CITIES = ['Teresina, PI', 'Parnaíba, PI', 'Tóquio, Japão', 'Paris, França', 'Nova York, EUA', 'São Raimundo Nonato, PI'];
export const TODAY = new Date().toISOString().slice(0, 10);
