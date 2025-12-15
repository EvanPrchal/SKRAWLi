import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { useState, useEffect } from "react";
import Loading from "./Components/Loading";
import NavigationHeader from "./Components/NavigationHeader";
import { Tab } from "@headlessui/react";
import ProfileInfo from "./Components/ProfileInfo";
import OwnedBadges from "./Components/OwnedBadges";
import ProfileFriendsTab from "./Components/ProfileFriendsTab";
import { useApi } from "./lib/api";
import { useDataReady } from "./lib/useDataReady";

const Profile = () => {
  const { isLoading } = useAuth0();
  const api = useApi();
  const normalizeBackground = (value?: string | null) => {
    if (!value) return "bg-skrawl-purple";
    return value === "bg-skrawl-black" ? "bg-skrawl-purple" : value;
  };

  const [profileBackground, setProfileBackground] = useState<string>("bg-skrawl-purple");
  const [draftBackground, setDraftBackground] = useState<string | null>(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState<boolean>(false);
  const [badgesLoaded, setBadgesLoaded] = useState<boolean>(false);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [ownedCodes, setOwnedCodes] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    // Fetch background
    api
      .getProfileBackground()
      .then((data) => {
        if (!cancelled) {
          setProfileBackground(normalizeBackground(data.profile_background));
          setBackgroundLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load background:", err);
        setBackgroundLoaded(true);
      });
    // Fetch badge data for gating
    Promise.all([api.listBadges(), api.getMyBadges()])
      .then(([definitions, owned]) => {
        if (!cancelled) {
          setAllBadges(definitions);
          setOwnedCodes(owned.map((b: any) => b.code));
          setBadgesLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load badges:", err);
        setBadgesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, api]);

  const ready = useDataReady([!isLoading, backgroundLoaded, badgesLoaded]);
  if (!ready) return <Loading />;

  const effectiveBackground = draftBackground ?? profileBackground;

  // Check if it's a hex color or Tailwind class
  const isHexColor = effectiveBackground.startsWith("#");
  const backgroundStyle = isHexColor ? { backgroundColor: effectiveBackground } : {};
  const backgroundClass = isHexColor ? "" : effectiveBackground;

  return (
    <div className={`flex flex-col min-h-screen ${backgroundClass} bg-[url(/src/assets/images/background.png)] bg-cover`} style={backgroundStyle}>
      <NavigationHeader />
      <div className="flex-1 flex justify-center items-center px-4 py-8">
        <div className="w-full max-w-5xl flex flex-col bg-skrawl-white overflow-hidden shadow-lg rounded-lg">
          <Tab.Group as="div" className="flex flex-col min-h-[60vh]">
            <Tab.List className="flex w-full justify-around text-header font-header bg-skrawl-purple">
              {["Profile", "Badges", "Friends"].map((tab) => (
                <Tab
                  key={tab}
                  className={({ selected }) =>
                    `py-2 px-4 text-skrawl-white hover:text-skrawl-magenta transition-colors focus:outline-none ${
                      selected ? "text-skrawl-orange" : ""
                    }`
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="flex-1 flex flex-col gap-0">
              <Tab.Panel className="w-full flex-1 flex items-center justify-center p-6">
                <ProfileInfo
                  profileBackground={profileBackground}
                  onBackgroundChange={setProfileBackground}
                  onBackgroundPreview={setDraftBackground}
                  onBackgroundPreviewEnd={() => setDraftBackground(null)}
                />
              </Tab.Panel>
              <Tab.Panel className="w-full flex-1 flex items-center justify-center p-6">
                <OwnedBadges allBadges={allBadges} ownedCodes={ownedCodes} />
              </Tab.Panel>
              <Tab.Panel className="w-full flex items-start justify-center p-4">
                <ProfileFriendsTab />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default withAuthenticationRequired(Profile, {
  onRedirecting: () => <Loading />,
});
