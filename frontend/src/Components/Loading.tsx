import { randomizeColor } from "./utils";

const Loading = () => {
  let bgColor: string = randomizeColor();
  return (
    <div className={`h-screen flex items-center justify-center ${bgColor} text-skrawl-white bg-cover bg-[url(/src/assets/images/background.png)]`}>
      <h1 className="text-logotype font-logotype">Loading ...</h1>
    </div>
  );
};

export default Loading;
