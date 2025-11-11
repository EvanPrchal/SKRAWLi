import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import NavigationHeader from "./Components/NavigationHeader";
import { Tab } from "@headlessui/react";
import ProfileInfo from "./Components/ProfileInfo";
import type { ProfileBadges } from "./Components/ProfileInfo";
import OwnedBadges from "./Components/OwnedBadges";

const Profile = () => {
  const { isLoading } = useAuth0();

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

  return (
    <div className="flex flex-col h-screen bg-skrawl-black bg-[url(/src/assets/images/background.png)]">
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
            <Tab.Panels className="flex-grow flex">
              <Tab.Panel className="h-full w-full flex items-center justify-center">
                <ProfileInfo badges={badges} />
              </Tab.Panel>
              <Tab.Panel className="h-full w-full flex items-center justify-center">
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
