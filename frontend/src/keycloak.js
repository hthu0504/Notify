import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8080",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "notify",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "notify-frontend",
});

let initPromise;

export const initKeycloak = () => {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
  }

  return initPromise;
};

export const getKeycloakUser = async () => {
  const profile = await keycloak.loadUserProfile().catch(() => ({}));
  const token = keycloak.tokenParsed ?? {};
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return {
    email: profile.email ?? token.email ?? token.preferred_username,
    name:
      fullName ||
      profile.username ||
      token.name ||
      token.preferred_username ||
      "Keycloak user",
    role: token.realm_access?.roles?.includes("admin") ? "admin" : "user",
  };
};

export default keycloak;
