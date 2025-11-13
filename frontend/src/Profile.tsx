import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { useState, useEffect } from "react";
import Loading from "./Components/Loading";
import NavigationHeader from "./Components/NavigationHeader";
import { Tab } from "@headlessui/react";
import ProfileInfo from "./Components/ProfileInfo";
import type { ProfileBadges } from "./Components/ProfileInfo";
import OwnedBadges from "./Components/OwnedBadges";
import { useApi } from "./lib/api";

const Profile = () => {
  const { isLoading } = useAuth0();
  const api = useApi();
  const [profileBackground, setProfileBackground] = useState<string>("bg-skrawl-black");

  useEffect(() => {
    if (!isLoading) {
      api
        .getProfileBackground()
        .then((data) => setProfileBackground(data.profile_background || "bg-skrawl-black"))
        .catch((err) => console.error("Failed to load background:", err));
    }
  }, [isLoading]);

  if (isLoading) {
    return <Loading />;
  }

  const badges: ProfileBadges = {
    badgeOne: "1",
    badgeTwo: "2",
    badgeThree: "3",
    badgeFour: "4",
    badgeFive: "5",
  };

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
              {["Profile", "Badges"].map((tab) => (
                <Tab
                  key={tab}
                  className={({ selected }) =>
                    `py-2 px-4 text-skrawl-white hover:text-skrawl-cyan transition-colors focus:outline-none ${selected ? "text-skrawl-orange" : ""}`
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="flex-grow flex overflow-y-auto">
              <Tab.Panel className="h-full w-full flex items-center justify-center p-4 overflow-y-auto">
                <ProfileInfo badges={badges} profileBackground={profileBackground} onBackgroundChange={setProfileBackground} />
              </Tab.Panel>
              <Tab.Panel className="h-full w-full flex items-center justify-center p-4 overflow-y-auto">
                <OwnedBadges />
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
