export type HelpTopic = {
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
};

const HELP_BY_PATH: Record<string, HelpTopic> = {
  "/dashboard": {
    title: "Inicio",
    summary: "Resumen del espacio y periodo activos: gastos por categoría, consejos y bolsillos.",
    steps: [
      "Elige el espacio (personal o compartido) arriba.",
      "Ajusta el periodo: este mes, mes anterior o un rango.",
      "Toca un trozo de la gráfica o una categoría para ver el detalle y luego ir a movimientos.",
      "Al entrar, verás recordatorios de pagos recurrentes pendientes este mes.",
    ],
    tip: "El saldo total está en Cuentas. En Inicio ves ingresos y gastos del periodo.",
  },
  "/transactions": {
    title: "Movimientos",
    summary: "Registra ingresos, gastos, transferencias y sigue el flujo del dinero por periodo.",
    steps: [
      "Elige el periodo: este mes, mes anterior o un rango de fechas.",
      "En tu perfil personal ves movimientos personales y de espacios a los que perteneces (categoría con el nombre del espacio).",
      "En un espacio compartido ves los movimientos de todos los miembros.",
      "En la lista ves descripción, categoría y fecha; toca un movimiento para ver el detalle.",
      "Arriba ves el total de los movimientos del periodo; se actualiza al filtrar por tipo, categoría, cuenta o usuario.",
      "Puedes indicar método de pago (efectivo, datáfono, transferencia…).",
      "Solo puedes editar o borrar los movimientos que creaste tú.",
    ],
    tip: "Fiducuenta → Ahorros se registra como Transferencia, no como gasto.",
  },
  "/accounts": {
    title: "Cuentas",
    summary: "Aquí viven tus cuentas bancarias, efectivo o billeteras del espacio activo.",
    steps: [
      "Arriba ves el saldo total. Primero gestiona instituciones y luego crea cuentas.",
      "Luego crea una cuenta eligiendo institución, tipo y saldo inicial.",
      "Las cuentas se agrupan por tipo y color (ahorros, corriente, efectivo…).",
      "Toca una cuenta o el ícono de historial para ver su flujo en el periodo.",
      "Activa Gestionar para editar, archivar o eliminar cuentas.",
    ],
    tip: "Sin cuentas no podrás registrar movimientos, pagos de deuda ni aportes de ahorro.",
  },
  "/consejos": {
    title: "Consejos",
    summary: "Tips financieros según tus tendencias de gasto del espacio y periodo activos.",
    steps: [
      "Revisa el consejo destacado también en Inicio.",
      "Cambia el periodo para ver tips del mes actual, anterior o un rango.",
      "Los consejos usan bolsillos, categorías y comparación con el periodo previo.",
    ],
  },
  "/categories": {
    title: "Categorías",
    summary: "Clasifican tus ingresos y gastos (comida, arriendo, salario, etc.).",
    steps: [
      "Hay categorías base del sistema; puedes agregar las tuyas.",
      "Usa Gestionar para editar, archivar o eliminar (si no tienen movimientos).",
      "Al crear o editar, elige un icono (incluye bicicleta, moto, mercado, salud, etc.).",
      "Los colores ayudan a reconocerlas en listas y gráficos.",
    ],
  },
  "/budgets": {
    title: "Bolsillos y presupuesto",
    summary:
      "Bolsillos por categoría, y presupuesto de espacios compartidos alimentado desde cuentas personales.",
    steps: [
      "Bolsillos, deudas y ahorros son independientes por espacio.",
      "Desde tu perfil personal: aporta a un espacio eligiendo espacio + cuenta bancaria.",
      "En un espacio compartido el saldo es aportado − gastado (presupuesto del espacio).",
      "En tu perfil personal el saldo total es la suma de tus cuentas bancarias.",
      "Desde un espacio compartido no se usan categorías de otros perfiles.",
    ],
  },
  "/debts": {
    title: "Deudas",
    summary: "Lleva el saldo pendiente de créditos u otras deudas del espacio.",
    steps: [
      "Crea una deuda con nombre y monto principal.",
      "Para registrar un pago necesitas una cuenta: usa Registrar pago.",
      "Gestionar permite editar o eliminar deudas (si no tienen pagos, o se archivan).",
    ],
  },
  "/savings": {
    title: "Ahorros",
    summary: "Metas de ahorro con avance según aportes y retiros.",
    steps: [
      "Crea una meta con monto objetivo y, opcionalmente, cuenta preferida.",
      "Registra aportes o retiros desde Movimiento (requiere cuenta).",
      "El progreso se calcula con esos movimientos.",
    ],
  },
  "/workspaces": {
    title: "Espacios",
    summary: "Separa lo personal de lo compartido y elige el tipo de espacio.",
    steps: [
      "Tu espacio Personal es privado.",
      "Al crear un espacio eliges el tipo: Hogar, Trabajo, Viaje u otro.",
      "Invita con un código (7 días, un uso).",
      "En Gestionar, el dueño puede quitar miembros del espacio compartido.",
      "En Gestionar → lápiz: sube una imagen y elige un color propio del espacio.",
      "Al cambiar de espacio, el color y la imagen del encabezado te indican dónde estás.",
      "Solo el dueño puede eliminar un espacio compartido.",
    ],
    tip: "Con Supabase configurado, el código funciona entre celulares y la web desplegada.",
  },
  "/settings": {
    title: "Perfil",
    summary: "Foto, nombre visible, tema claro/oscuro y color de acento personal.",
    steps: [
      "Carga una foto para tu cuenta personal (aparece en Inicio y en la barra).",
      "Cambia tu nombre para que otros miembros te reconozcan en espacios compartidos.",
      "Elige tema claro, oscuro, sistema o personalizado.",
      "El color de acento del perfil se usa si el espacio activo no tiene color propio.",
      "Para imagen y color del espacio, ve a Espacios → Gestionar.",
    ],
  },
};

const DEFAULT_HELP: HelpTopic = {
  title: "Ayuda",
  summary: "App para controlar presupuesto personal y familiar.",
  steps: [
    "Usa el menú para moverte entre secciones.",
    "Empieza por Cuentas e Instituciones, luego registra movimientos.",
  ],
};

export function helpForPath(pathname: string): HelpTopic {
  return HELP_BY_PATH[pathname] ?? DEFAULT_HELP;
}
