import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <button onClick={() => loginWithRedirect()} className="text-header font-header text-skrawl-purple hover:text-skrawl-magenta hover:cursor-pointer">
      Log In
    </button>
  );
};

export default LoginButton;
