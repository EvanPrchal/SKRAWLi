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
      <div className="text-center h-full flex justify-around">
        <section className="flex flex-col justify-center items-center">
          <img className="w-[50%] border-dotted border-3 p-3" src={user?.picture} alt={user?.name} />
          <h2 className="text-header font-body">Username Placeholder</h2>
          <h2 className="text-body font-body">This is a bio placeholder</h2>
        </section>
        <section className="flex flex-col items-center justify-center">
          <h2 className="text-header font-body underline">Badges</h2>
          <div className="flex justify-around">
            {badgeUrls.map((url, idx) => (
              <img key={idx} src={url} alt={`Badge ${idx + 1}`} className="badge-image" />
            ))}
          </div>
        </section>
      </div>
    )
  );
};

export default ProfileInfo;
