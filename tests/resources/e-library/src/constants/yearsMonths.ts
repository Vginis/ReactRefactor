const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1).padStart(2, "0"),
}));

const years = Array.from({ length: 15 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: String(year), label: String(year) };
});

export { months, years }