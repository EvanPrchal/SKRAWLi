import { Link } from "react-router-dom";

const NavigationHeader = () => {
  return (
    <nav className="w-full bg-skrawl-purple text-skrawl-white py-4 px-8 sticky top-0">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-header font-header hover:text-skrawl-magenta transition-colors underline">
          SKRAWLi
        </Link>
        <div className="flex gap-6 text-body font-body">
          <Link to="/run" className="hover:text-skrawl-magenta transition-colors">
            Start Run
          </Link>
          <Link to="/minigameselect" className="hover:text-skrawl-magenta transition-colors">
            Minigame Select
          </Link>
          <Link to="/shop" className="hover:text-skrawl-magenta transition-colors">
            Shop
          </Link>
          <Link to="/profile" className="hover:text-skrawl-magenta transition-colors">
            Profile
          </Link>
          <Link to="/options" className="hover:text-skrawl-magenta transition-colors">
            Options
          </Link>
          <Link to="/credits" className="hover:text-skrawl-magenta transition-colors">
            Credits
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavigationHeader;
