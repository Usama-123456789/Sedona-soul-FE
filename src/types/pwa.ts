export type PwaInstallState = "unsupported" | "available" | "installed" | "dismissed";

export type ServiceWorkerStrategy = {
  cacheName: string;
  cacheSensitiveUserData: false;
  registrationMode: "production-only";
};
