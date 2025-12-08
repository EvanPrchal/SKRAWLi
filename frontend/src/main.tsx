import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { ThemeProvider } from "./lib/theme.tsx";
import "./index.css";
import Home from "./Home.tsx";
import FreeDraw from "./FreeDraw.tsx";
import Run from "./Run.tsx";
import MinigameSelect from "./MinigameSelect.tsx";
import Profile from "./Profile.tsx";
import Credits from "./Credits.tsx";
import Options from "./Options.tsx";
import Shop from "./Shop.tsx";
import UserProfile from "./UserProfile.tsx";

declare global {
  interface Window {
    __skrawliDragGuardsInstalled__?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__skrawliDragGuardsInstalled__) {
  const INTERACTIVE_SELECTOR = "button, a, [role='button'], input, select, textarea";

  const preventDragStart = (event: DragEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE_SELECTOR)) {
      event.preventDefault();
    }
  };

  const preventPenDrag = (event: PointerEvent) => {
    if (!(event.buttons & 1)) return; // only when primary button (pen tip) is pressed
    if (event.pointerType !== "pen" && event.pointerType !== "touch") {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE_SELECTOR)) {
      event.preventDefault();
    }
  };

  window.addEventListener("dragstart", preventDragStart);
  window.addEventListener("pointermove", preventPenDrag, { passive: false });

  window.__skrawliDragGuardsInstalled__ = true;
}
createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: "openid profile email",
    }}
  >
    <ThemeProvider>
      <StrictMode>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/run" element={<Run />} />
            <Route path="/continue" element={<Run />} />
            <Route path="/minigameselect" element={<MinigameSelect />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/options" element={<Options />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/freedraw" element={<FreeDraw />} />
            <Route path="/users/:id" element={<UserProfile />} />
          </Routes>
        </BrowserRouter>
      </StrictMode>
    </ThemeProvider>
  </Auth0Provider>
);
