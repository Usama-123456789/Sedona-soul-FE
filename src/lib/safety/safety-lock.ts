import { entrySafetyCompleteCookieName, safetyLockCookieName } from "@/lib/auth/routes";

const maxAge = 60 * 60 * 24;

export function setSafetyLock() {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = `${safetyLockCookieName}=true; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `${entrySafetyCompleteCookieName}=; path=/; max-age=0; samesite=lax`;
  window.localStorage.setItem(safetyLockCookieName, "true");
  window.localStorage.removeItem(entrySafetyCompleteCookieName);
  window.dispatchEvent(new CustomEvent("sedona:safety-lock-change", { detail: { locked: true } }));
}

export function clearSafetyLock() {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = `${safetyLockCookieName}=; path=/; max-age=0; samesite=lax`;
  window.localStorage.removeItem(safetyLockCookieName);
  window.dispatchEvent(new CustomEvent("sedona:safety-lock-change", { detail: { locked: false } }));
}

export async function completeEntrySafetyGate() {
  if (typeof window === "undefined") {
    return;
  }

  const response = await fetch("/api/safety/entry/complete", {
    cache: "no-store",
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to complete entry safety gate.");
  }

  clearSafetyLock();
  document.cookie = `${entrySafetyCompleteCookieName}=true; path=/; max-age=${maxAge}; samesite=lax`;
  window.localStorage.setItem(entrySafetyCompleteCookieName, "true");
}

export function hasClientSafetyLock() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(safetyLockCookieName) === "true" ||
    document.cookie.split("; ").some((cookie) => cookie === `${safetyLockCookieName}=true`)
  );
}
