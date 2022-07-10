import { User } from "../types/types";

export const createUser = (username: string, socketId: string): User => {
  return {
    id: socketId,
    name: username,
    isReady: false,
    room: null,
    progress: 0,
  };
};

export const isActiveUser = (activeUsers: User[], username: string) => {
  return activeUsers.find((user) => user.name == username);
};

export const deleteUser = (activeUsers: User[], socketId: string) => {
  return activeUsers.filter((user) => {
    return user.id != socketId;
  });
};

export const addUserRoom = (activeUsers: User[], socketId: string, roomName: string) => {
  return activeUsers.map((user) =>
    user.id === socketId
      ? {
          id: socketId,
          name: user.name,
          isReady: false,
          room: roomName,
          progress: 0,
        }
      : user
  );
};

export const removeUserRoom = (activeUsers: User[], socketId: string) => {
  return activeUsers.map((user) =>
    user.id === socketId
      ? {
          id: socketId,
          name: user.name,
          isReady: false,
          room: null,
          progress: 0,
        }
      : user
  );
};

export const getUser = (activeUsers: User[], socketId: string) => {
  return activeUsers.find((user) => {
    return user.id === socketId;
  });
};

export const getUsersFromRoom = (activeUsers: User[], roomName: string) => {
  return activeUsers.filter((user) => user.room === roomName);
};
