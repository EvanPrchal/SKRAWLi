import { randomizeColor } from "./Components/utils";

const Credits = () => {
  let bgColor: string = randomizeColor();
  return (
    <div className={`h-screen flex flex-col items-center gap-[5%] ${bgColor} text-skrawl-white bg-cover bg-[url(/src/assets/images/background.png)]`}>
      <h1 className="text-logotype font-logotype">Credits</h1>
      <section className="text-header font-header flex flex-col items-center">
        Lead Developer<hr className="w-full"></hr> <h2 className="text-header font-header">Evan Prchal</h2>
      </section>
      <section className="text-header font-header flex flex-col items-center">
        Lead Artist <hr className="w-full"></hr>
        <h2 className="text-header font-header">Morgan Myers</h2>
      </section>
      <section className="text-header font-header flex flex-col items-center">
        Doodle Background <hr className="w-full"></hr>
        <h2 className="text-header font-header">superwerehog990</h2>
      </section>
    </div>
  );
};

export default Credits;
