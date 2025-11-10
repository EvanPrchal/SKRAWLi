import { Link } from "react-router-dom";
import LoginButton from "./Components/LoginButton";
import LogoutButton from "./Components/LogoutButton";
function Home() {
  return (
    <div className="flex h-screen bg-skrawl-cyan bg-cover bg-[url(/src/assets/images/background.png)] justify-center">
      <div className="w-4/6 bg-skrawl-white">
        <section className="text-header font-header text-skrawl-purple flex flex-col justify-around items-center h-full">
          <h1 className="text-logotype font-logotype text-skrawl-purple  underline">SKRAWLi</h1>
          <Link to="/run">
            <p className="hover:text-skrawl-magenta">Start Run</p>
          </Link>
          <Link to="/minigameselect">
            <p className="hover:text-skrawl-magenta">Minigame Select</p>
          </Link>
          <Link to="/shop">
            <p className="hover:text-skrawl-magenta">Shop</p>
          </Link>
          <Link to="/profile">
            <p className="hover:text-skrawl-magenta">Profile</p>
          </Link>
          <Link to="/options">
            <p className="hover:text-skrawl-magenta">Options</p>
          </Link>
          <Link to="/credits">
            <p className="hover:text-skrawl-magenta">Credits</p>
          </Link>
          <section className="flex w-full justify-between px-[5%]">
            <LoginButton />
            <LogoutButton />
          </section>
        </section>
      </div>
    </div>
  );
}

export default Home;
