export function displayToken(doctorCode, tokenNumber) {
  const num = String(tokenNumber).padStart(3, "0");
  return `${doctorCode}-${num}`;
}