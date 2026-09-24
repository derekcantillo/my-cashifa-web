// TODO: el backend no distingue pasivos en $0 de pasivos no implementados — ajustar cuando
// el modelo de Deudas/Tarjetas exista. Hoy `/net-worth` devuelve `debts` y `creditCardsDebt`
// fijos en 0 (NetWorthService: "frentes posteriores"), así que se muestran como
// "Próximamente". Al implementarlos, poner esto en `true` y la pantalla mostrará los montos.
export const LIABILITIES_IMPLEMENTED = false
