import { Link } from "react-router-dom";
import LoginButton from "./Components/LoginButton";
import LogoutButton from "./Components/LogoutButton";
function Home() {
  return (
    <div className="flex h-screen bg-skrawl-black bg-cover bg-[url(/src/assets/images/background.png)] justify-center">
      <div className="w-4/6 bg-skrawl-white">
        <section className="text-header font-header text-skrawl-black flex flex-col justify-around items-center h-full">
          <h1 className="text-logotype font-logotype text-skrawl-black underline">SKRAWLi</h1>
          <p>Continue</p>
          <Link to="/run">
            <p>Start Run</p>
          </Link>
          <Link to="/shop">
            <p>Shop</p>
          </Link>
          <Link to="/profile">
            <p>Profile</p>
          </Link>
          <Link to="/options">
            <p>Options</p>
          </Link>
          <Link to="/credits">
            <p>Credits</p>
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
