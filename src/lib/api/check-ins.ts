import { readApiResponse } from "@/lib/api/audio";
import type {
  CheckInAnswersPayload,
  CreateSafetyEventPayload,
  DashboardContext,
  DailySessionResponse,
  PacingAnswer,
  SafetyAnswersPayload,
  SafetyEvent,
  SafetyResource,
} from "@/types/check-in";

export async function getDashboardContext() {
  const response = await fetch("/api/dashboard", {
    cache: "no-store",
  });

  return readApiResponse<DashboardContext>(response);
}

export async function startDailyCheckIn(source = "dashboard") {
  const response = await fetch("/api/check-ins", {
    body: JSON.stringify({ source }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readApiResponse<DailySessionResponse>(response);
}

export async function submitSafetyAnswers(dailySessionId: string, answers: SafetyAnswersPayload) {
  const response = await fetch(`/api/check-ins/${encodeURIComponent(dailySessionId)}/safety`, {
    body: JSON.stringify({ answers }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readApiResponse<DailySessionResponse>(response);
}

export async function submitPacingAnswer(dailySessionId: string, answer: PacingAnswer) {
  const response = await fetch(`/api/check-ins/${encodeURIComponent(dailySessionId)}/pacing`, {
    body: JSON.stringify({ answer }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readApiResponse<DailySessionResponse>(response);
}

export async function submitCheckInAnswers(dailySessionId: string, payload: CheckInAnswersPayload) {
  const response = await fetch(`/api/check-ins/${encodeURIComponent(dailySessionId)}/answers`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readApiResponse<DailySessionResponse>(response);
}

export async function listSafetyResources() {
  const response = await fetch("/api/safety/resources", {
    cache: "no-store",
  });

  const data = await readApiResponse<{ resources: SafetyResource[] }>(response);

  return data.resources;
}

export async function createSafetyEvent(payload: CreateSafetyEventPayload) {
  const response = await fetch("/api/safety/events", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = await readApiResponse<{ event: SafetyEvent }>(response);

  return data.event;
}
