export type HelpTopic = {
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
};

const HELP_BY_PATH: Record<string, HelpTopic> = {
  "/dashboard": {
    title: "Inicio",
    summary: "Resumen del espacio activo: gastos, ingresos y cómo vas en el mes.",
    steps: [
      "Elige el espacio (personal o familiar) en el selector de arriba.",
      "Revisa totales y gráficos del periodo actual.",
      "Usa el menú inferior o lateral para ir a movimientos, cuentas u otras secciones.",
    ],
    tip: "Los números dependen del espacio seleccionado y de los movimientos que hayas registrado.",
  },
  "/transactions": {
    title: "Movimientos",
    summary: "Registra ingresos, gastos, transferencias, pagos de deuda y aportes a ahorro.",
    steps: [
      "Antes necesitas al menos una cuenta en Cuentas.",
      "Pulsa + Nuevo y elige el tipo de movimiento.",
      "Indica monto, fecha, cuenta y (si aplica) categoría, deuda o meta.",
      "Puedes marcar un movimiento como recurrente y repetirlo después.",
      "Solo puedes editar o borrar los movimientos que creaste tú.",
    ],
    tip: "Puedes asignar un gasto al espacio personal o a uno familiar sin cambiar de pantalla.",
  },
  "/accounts": {
    title: "Cuentas",
    summary: "Aquí viven tus cuentas bancarias, efectivo o billeteras del espacio activo.",
    steps: [
      "Primero gestiona instituciones (bancos, billeteras, etc.) con el botón Instituciones.",
      "Luego crea una cuenta eligiendo institución, tipo y saldo inicial.",
      "Activa Gestionar para editar, archivar o eliminar cuentas.",
    ],
    tip: "Sin cuentas no podrás registrar movimientos, pagos de deuda ni aportes de ahorro.",
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
    summary: "Separa lo personal de lo familiar (o varios espacios compartidos).",
    steps: [
      "Tu espacio Personal es privado.",
      "Crea un espacio familiar e invita con un código (7 días, un uso).",
      "Otra persona se registra en la misma app y une el código.",
      "Solo el dueño puede eliminar un espacio compartido.",
    ],
    tip: "Con Supabase configurado, el código funciona entre celulares y la web desplegada.",
  },
  "/settings": {
    title: "Perfil",
    summary: "Foto, nombre visible, tema y color de acento de la app.",
    steps: [
      "Carga una foto para tu cuenta personal (aparece en Inicio y en la barra).",
      "Cambia tu nombre para que otros miembros te reconozcan en espacios compartidos.",
      "Elige tema claro, oscuro, sistema o personalizado.",
      "El color de acento se aplica a botones y detalles de la interfaz.",
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
