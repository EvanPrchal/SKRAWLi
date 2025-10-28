import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
//import "react-tabs/style/react-tabs.css";
import ProfileInfo from "./Components/ProfileInfo";
import type { ProfileBadges } from "./Components/ProfileInfo";
import OwnedBadges from "./Components/OwnedBadges";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

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
    isAuthenticated && (
      <div className="flex flex-col h-screen bg-skrawl-black bg-[url(/src/assets/images/background.png)] items-center justify-center">
        <Tabs className="w-4/6 h-4/6 flex flex-col bg-skrawl-white">
          <TabList className="flex w-full justify-around text-header font-header bg-skrawl-black">
            <Tab className="text-skrawl-white hover:text-skrawl-cyan hover-cursor-pointer active:text-skrawl-orange">Profile</Tab>
            <Tab className="text-skrawl-white hover:text-skrawl-cyan hover-cursor-pointer active:text-skrawl-orange">Badges</Tab>
          </TabList>
          <section className="flex flex-col h-full items-center justify-center">
            <TabPanel>
              <ProfileInfo badges={badges} />
            </TabPanel>

            <TabPanel>
              <OwnedBadges />
            </TabPanel>
          </section>
        </Tabs>
      </div>
    )
  );
};

export default Profile;
