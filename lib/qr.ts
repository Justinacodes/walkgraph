export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function buildCheckpointUrl(buildingId: string, checkpointCode: string) {
  return `${getAppUrl()}/navigate/${buildingId}?node=${checkpointCode}`;
}

export function getShortCheckpointCode(code: string) {
  return code.slice(-6).toUpperCase();
}
