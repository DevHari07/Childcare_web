import type { TranslationKey } from './en';
import es from './es';

// Spanish (Mexico). Formal government-form Spanish barely differs between
// Spain/neutral-Latin-American and Mexican usage, so this inherits the
// `es` dictionary wholesale and only overrides the handful of terms that
// genuinely differ in Mexican official documents (e.g. "Domicilio" instead
// of "Dirección", "celular" phrasing, etc.) rather than inventing
// differences that don't really exist in formal register.
const esMX: Record<TranslationKey, string> = {
  ...es,

  'login.brandState': 'DAKOTA DEL NORTE',
  'signup.brandState': 'DAKOTA DEL NORTE',

  'field.residentialAddress': 'Domicilio',
  'field.mailingAddress': 'Domicilio para correspondencia (si es diferente al domicilio)',
  'field.addressLine1': 'Domicilio (línea 1)',
  'field.addressLine2': 'Domicilio (línea 2)',
  'field.zip': 'Código Postal',
  'field.cellPhone': 'Celular',
  'field.homePhone': 'Teléfono fijo',
  'field.ssn': 'Número de Seguro Social (SSN)',
  'field.knowsAddressQuestion': '¿Conoce el domicilio actual del padre o madre sin custodia?',

  'review.address': 'Domicilio',

  'signup.cellPhone': 'Número de celular',
};

export default esMX;
