import { useState, useEffect } from "react";
import { randomizeColor } from "./utils";

const Redirecting = () => {
  const [dots, setDots] = useState(1);
  let bgColor: string = randomizeColor();

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`h-screen flex items-center justify-center ${bgColor} text-skrawl-white bg-cover bg-[url(/src/assets/images/background.png)]`}>
      <h1 className="text-logotype font-logotype">Redirecting {".".repeat(dots)}</h1>
    </div>
  );
};

export default Redirecting;
