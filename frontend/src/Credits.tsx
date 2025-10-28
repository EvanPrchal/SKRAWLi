const Credits = () => {
  let bgColor: string = "bg-skrawl-black";
  let loadingColor: 0 | 1 | 2 | 3 | 4 = Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4;
  if (loadingColor === 0) {
    bgColor = "bg-skrawl-magenta";
  } else if (loadingColor === 1) {
    bgColor = "bg-skrawl-cyan";
  } else if (loadingColor === 2) {
    bgColor = "bg-skrawl-orange";
  } else if (loadingColor === 3) {
    bgColor = "bg-skrawl-blue";
  } else {
    bgColor = "bg-skrawl-purple";
  }
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
