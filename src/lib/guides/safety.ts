export interface SafetyFlag {
  flag: string
  warning: string
}

const SAFETY_RULES: Record<string, SafetyFlag> = {
  embarazo:     { flag: 'cond-embarazo',    warning: 'Estás embarazada o lactando — consulta con tu médico antes de tomar cualquier suplemento.' },
  digestivo:    { flag: 'cond-digestivos',  warning: 'Tienes sensibilidad digestiva — toma los productos con comida y comienza con dosis bajas.' },
  alergias:     { flag: 'cond-alergias',    warning: 'Tu piel es sensible — revisa los ingredientes de cada producto antes de usarlo.' },
  medicamentos: { flag: 'cond-medicamentos',warning: 'Estás tomando medicamentos — consulta con tu médico antes de combinar con suplementos.' },
  'alerg-gluten':  { flag: 'alerg-gluten',  warning: 'Tienes sensibilidad al gluten — verifica que los productos sean libres de gluten.' },
  'alerg-lactosa': { flag: 'alerg-lactosa', warning: 'Tienes intolerancia a la lactosa — algunos suplementos contienen trazas de lácteos.' },
  'alerg-cafeina': { flag: 'alerg-cafeina', warning: 'Evitas la cafeína — revisa los ingredientes de energizantes o pre-entrenos.' },
  'piel-sensible': { flag: 'piel-sensible', warning: 'Tu piel es sensible — haz prueba de parche antes de usar cualquier producto tópico.' },
}

export function evaluateSafetyFlags(appliedTags: string[]): SafetyFlag[] {
  return appliedTags
    .filter(tag => tag in SAFETY_RULES)
    .map(tag => SAFETY_RULES[tag])
}
