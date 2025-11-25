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
  const [profileBackground, setProfileBackground] = useState<string>("bg-skrawl-black");
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
          setProfileBackground(data.profile_background || "bg-skrawl-black");
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

  // Check if it's a hex color or Tailwind class
  const isHexColor = profileBackground.startsWith("#");
  const backgroundStyle = isHexColor ? { backgroundColor: profileBackground } : {};
  const backgroundClass = isHexColor ? "" : profileBackground;

  return (
    <div className={`flex flex-col h-screen ${backgroundClass} bg-[url(/src/assets/images/background.png)] bg-cover`} style={backgroundStyle}>
      <NavigationHeader />
      <div className="flex items-center justify-center flex-grow">
        <div className="w-4/6 h-5/6 flex flex-col bg-skrawl-white overflow-hidden">
          <Tab.Group as="div" className="flex flex-col h-full">
            <Tab.List className="flex w-full justify-around text-header font-header bg-skrawl-black">
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
            <Tab.Panels className="flex-grow flex overflow-y-auto">
              <Tab.Panel className="h-full w-full flex items-center justify-center p-4 overflow-y-auto">
                <ProfileInfo profileBackground={profileBackground} onBackgroundChange={setProfileBackground} />
              </Tab.Panel>
              <Tab.Panel className="h-full w-full flex items-center justify-center p-4 overflow-y-auto">
                <OwnedBadges allBadges={allBadges} ownedCodes={ownedCodes} />
              </Tab.Panel>
              <Tab.Panel className="h-full w-full flex items-start justify-center p-4 overflow-y-auto">
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
