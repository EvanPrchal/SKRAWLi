import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import Home from "./Home.tsx";
import Run from "./Run.tsx";
import Profile from "./Profile.tsx";
import Credits from "./Credits.tsx";
createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain="dev-v0mmlcufmyjsq8l7.us.auth0.com"
    clientId="oO9Bl8mHNuo4W6tCMgDErHGfw2pSymZe"
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
  >
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/run" element={<Run />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/credits" element={<Credits />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  </Auth0Provider>
);
