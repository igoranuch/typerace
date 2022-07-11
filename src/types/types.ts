export type User = {
  id: string;
  name: string;
  isReady: boolean;
  room: string | null;
  progress: number;
};

export type Room = {
  name: string;
  numberOfUsers: number;
  isFull: boolean;
  timerStarted: boolean;
};
