import mitt from "mitt";

type Events = {
  animate: {
    delta: number;
    elapsed: number;  
  };
};

export const emitter = mitt<Events>()