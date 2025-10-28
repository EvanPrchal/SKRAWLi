const Loading = () => {
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
    <div className={`h-screen flex items-center justify-center ${bgColor} text-skrawl-white bg-cover bg-[url(/src/assets/images/background.png)]`}>
      <h1 className="text-logotype font-logotype">Loading ...</h1>
    </div>
  );
};

export default Loading;
