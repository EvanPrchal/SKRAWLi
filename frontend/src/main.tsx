import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { ThemeProvider } from "./lib/theme.tsx";
import "./index.css";
import Home from "./Home.tsx";
import Run from "./Run.tsx";
import MinigameSelect from "./MinigameSelect.tsx";
import Profile from "./Profile.tsx";
import Credits from "./Credits.tsx";
import Options from "./Options.tsx";
import Shop from "./Shop.tsx";
createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
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
          </Routes>
        </BrowserRouter>
      </StrictMode>
    </ThemeProvider>
  </Auth0Provider>
);
