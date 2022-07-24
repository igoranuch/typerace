export type User = {
  id: string;
  name: string;
  isReady: boolean;
  room: string | null;
  progress: number;
  time: number;
};

export type Room = {
  name: string;
  numberOfUsers: number;
  isFull: boolean;
  timerStarted: boolean;
};

export type UserProgress = {
  progress: number;
  time: number;
};
