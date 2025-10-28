import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import { CountdownTimer } from "./Components/Countdown";
import Canvas from "./Components/Canvas";
const Run = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <Loading />;
  }
  //svg img src size needs to be changed
  return (
    isAuthenticated && (
      <div className="flex flex-col h-screen bg-skrawl-black">
        <section className="h-1/6 text-skrawl-white border-b-3 border-black flex justify-around font-header text-header items-end">
          <section className="flex">
            <img src="./src/assets/svgs/lives.png" alt="Lives"></img>

            <h1>x3</h1>
          </section>
          <img src={user?.picture} alt={user?.name} className="w-[5%] self-center" />
          <section className="flex">
            <CountdownTimer initialSeconds={60} />
            <img src="./src/assets/svgs/time.png" alt="Seconds"></img>
          </section>
        </section>
        <div className="flex grow flex-row">
          <section className="w-1/6 border-r-3"></section>
          <Canvas />
          <section className="w-1/6 border-l-3"></section>
        </div>
        <section className="h-1/6 border-t-3"></section>
      </div>
    )
  );
};

export default Run;
