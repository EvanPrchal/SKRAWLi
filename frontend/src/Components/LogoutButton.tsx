import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="text-header font-header text-skrawl-purple hover:text-skrawl-magenta hover:cursor-pointer transition-colors"
    >
      Log Out
    </button>
  );
};

export default LogoutButton;
