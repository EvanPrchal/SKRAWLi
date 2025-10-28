import { ReactSketchCanvas } from "react-sketch-canvas";

const styles = {
  border: "0.0625rem solid #9c9c9c",
  borderRadius: "0.25rem",
  flexGrow: 1,
};

const Canvas = () => {
  return <ReactSketchCanvas style={styles} width="600" height="400" strokeWidth={4} strokeColor="black" />;
};

export default Canvas;
