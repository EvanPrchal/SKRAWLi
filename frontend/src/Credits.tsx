import { randomizeColor } from "./Components/utils";
import NavigationHeader from "./Components/NavigationHeader";

const Credits = () => {
  let bgColor: string = randomizeColor();
  return (
    <div className={`flex flex-col min-h-screen w-full ${bgColor} text-skrawl-white bg-cover bg-center bg-[url(/src/assets/images/background.png)]`}>
      <NavigationHeader />
      <div className="flex flex-col items-center justify-center flex-grow gap-8 py-8">
        <h1 className="text-logotype font-logotype">Credits</h1>
        <section className="text-header font-header flex flex-col items-center">
          Lead Developer<hr className="w-full border-t-4 border-skrawl-white"></hr> <h2 className="text-button font-body">Evan Prchal</h2>
        </section>
        <section className="text-header font-header flex flex-col items-center">
          Lead Artist <hr className="w-full border-t-4 border-skrawl-white"></hr>
          <h2 className="text-button font-body">
            <span className="group inline-flex items-center gap-2">
              <span>Morgan Myers</span>
              <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">&lt;3</span>
            </span>
          </h2>
        </section>
        <section className="text-header font-header flex flex-col items-center">
          Doodle Background <hr className="w-full border-t-4 border-skrawl-white"></hr>
          <a
            className="text-button font-body hover:text-skrawl-purple transition-colors"
            href="https://www.instagram.com/superwerehog_990/"
            target="_blank"
          >
            superwerehog_990
          </a>
        </section>
        <section className="text-header font-header flex flex-col items-center">
          Main Color Scheme <hr className="w-full border-t-4 border-skrawl-white"></hr>
          <h2 className="text-button font-body">Valeria Gonzalez Ramos</h2>
        </section>
        <section className="text-header font-header flex flex-col items-center">
          Inspirations <hr className="w-full border-t-4 border-skrawl-white"></hr>
          <h2 className="text-button font-body">Warioware</h2>
          <a className="text-button font-body hover:text-skrawl-purple transition-colors" href="https://drawabox.com/" target="_blank">
            Drawabox
          </a>
          <h2 className="text-button font-body">Snipperclips</h2>
          <a className="text-button font-body hover:text-skrawl-purple transition-colors" href="https://wigglypaint.com/en/" target="_blank">
            Wigglypaint
          </a>
          <a
            className="text-button font-body hover:text-skrawl-purple transition-colors"
            href="https://store.steampowered.com/app/2741670/MINDWAVE_Demo/"
            target="_blank"
          >
            Mindwave (Check it out its really cool)
          </a>
        </section>
      </div>
    </div>
  );
};

export default Credits;
