export type HelpTopic = {
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
};

const HELP_BY_PATH: Record<string, HelpTopic> = {
  "/dashboard": {
    title: "Inicio",
    summary: "Resumen del espacio y periodo activos: saldo, gastos, consejo y actividad.",
    steps: [
      "Elige el espacio (personal o familiar) arriba.",
      "Ajusta el periodo: este mes, mes anterior o un rango.",
      "Revisa el consejo destacado y entra a Consejos para ver más.",
      "Los gráficos y la actividad usan solo el periodo seleccionado.",
    ],
    tip: "Si dejas “Este mes”, al cambiar el mes la información se actualiza sola.",
  },
  "/transactions": {
    title: "Movimientos",
    summary: "Registra ingresos, gastos, transferencias y sigue el flujo del dinero por periodo.",
    steps: [
      "Elige el periodo: este mes, mes anterior o un rango de fechas.",
      "Solo ves movimientos del espacio activo (sus categorías, deudas o metas).",
      "En la lista ves descripción, categoría y fecha; toca un movimiento para ver el detalle.",
      "Filtra por categoría o por cuenta para ver el flujo de una cuenta.",
      "Puedes indicar método de pago (efectivo, datáfono, transferencia…).",
      "Solo puedes editar o borrar los movimientos que creaste tú.",
    ],
    tip: "Fiducuenta → Ahorros se registra como Transferencia, no como gasto.",
  },
  "/accounts": {
    title: "Cuentas",
    summary: "Aquí viven tus cuentas bancarias, efectivo o billeteras del espacio activo.",
    steps: [
      "Primero gestiona instituciones con el botón Instituciones.",
      "Luego crea una cuenta eligiendo institución, tipo y saldo inicial.",
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
      "Los consejos usan presupuestos, categorías y comparación con el periodo previo.",
    ],
  },
  "/categories": {
    title: "Categorías",
    summary: "Clasifican tus ingresos y gastos (comida, arriendo, salario, etc.).",
    steps: [
      "Hay categorías base del sistema; puedes agregar las tuyas.",
      "Usa Gestionar para editar, archivar o eliminar (si no tienen movimientos).",
      "Los colores ayudan a reconocerlas en listas y gráficos.",
    ],
  },
  "/budgets": {
    title: "Presupuestos",
    summary: "Define un tope mensual por categoría de gasto.",
    steps: [
      "Elige una categoría y el límite del mes.",
      "Compara lo presupuestado con lo gastado en movimientos.",
      "Ajusta o elimina límites cuando cambien tus prioridades.",
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
    summary: "Separa lo personal de lo familiar y personaliza cada espacio.",
    steps: [
      "Tu espacio Personal es privado.",
      "Crea un espacio familiar e invita con un código (7 días, un uso).",
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
