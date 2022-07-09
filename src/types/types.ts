export type User = {
  id: string;
  name: string;
  isReady: boolean;
  gameProgress: number;
};

export type Room = {
  name: string;
  userCount: number;
};
