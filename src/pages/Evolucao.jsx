export const parseDate = (str) => {
  if (!str) return null;
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, m - 1, d);
};

export const daysUntil = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return null;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.floor((d - t) / 86400000);
};

export const daysSince = (dateStr) => {
  const u = daysUntil(dateStr);
  return u === null ? null : -u;
};

export const formatDays = (d) => {
  if (d === null) return "";
  if (d < 0)  return `${-d}d atrás`;
  if (d === 0) return "hoje";
  if (d === 1) return "amanhã";
  if (d < 7)  return `em ${d}d`;
  if (d < 30) return `em ${Math.floor(d / 7)}sem`;
  return `em ${Math.floor(d / 30)}m`;
};

export const alertLevel = (d) => {
  if (d === null) return null;
  if (d < 0)  return "danger";
  if (d <= 7) return "alert";
  return null;
};

export const MESES_PT   = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
export const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
export const WEEK_L     = ["D","S","T","Q","Q","S","S"];
