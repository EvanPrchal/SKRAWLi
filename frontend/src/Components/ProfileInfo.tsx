import { useAuth0 } from "@auth0/auth0-react";

export type ProfileBadges = {
  badgeOne: string;
  badgeTwo: string;
  badgeThree: string;
  badgeFour: string;
  badgeFive: string;
};

interface BadgeProps {
  badges: ProfileBadges;
}

const ProfileInfo: React.FC<BadgeProps> = ({ badges }) => {
  const { user, isAuthenticated } = useAuth0();
  const badgeUrls = Object.values(badges);

  return (
    isAuthenticated && (
      <div className="text-center flex justify-around w-full gap-8">
        <section className="flex flex-col justify-center items-center space-y-4">
          <img className="border-dotted border-3 p-3" src={user?.picture} alt={user?.name} />
          <h2 className="text-header font-body text-skrawl-purple">Username Placeholder</h2>
          <h2 className="text-body font-body text-skrawl-black">This is a bio placeholder</h2>
        </section>
        <section className="flex flex-col items-center justify-center space-y-6">
          <h2 className="text-header font-body underline text-skrawl-purple">Badges</h2>
          <div className="flex gap-6 flex-wrap justify-around w-full max-w-md">
            {badgeUrls.map((url, idx) => (
              <img key={idx} src={url} alt={`Badge ${idx + 1}`} className="w-16 h-16 rounded-full shadow-md" />
            ))}
          </div>
        </section>
      </div>
    )
  );
};

export default ProfileInfo;
