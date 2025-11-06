import { useAuth0 } from "@auth0/auth0-react";

const OwnedBadges = () => {
  const { isAuthenticated } = useAuth0();

  return (
    isAuthenticated && (
      <div className="grid grid-cols-5 place-items-center text-header h-full w-full">
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
        <h1>Badge</h1>
      </div>
    )
  );
};

export default OwnedBadges;
