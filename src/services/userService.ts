import { User } from "../types/types";

export const createUser = (username: string, socketId: string): User => {
  return {
    id: socketId,
    name: username,
    isReady: false,
    gameProgress: 0,
  };
};

export const isActiveUser = (activeUsers: User[], username: string) => {
  return activeUsers.find((user) => user.name == username);
};

export const deleteUser = (activeUsers: User[], socketId) => {
  return activeUsers.filter((user) => {
    return user.id != socketId;
  });
};
