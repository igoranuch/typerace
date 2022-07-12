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

export const isActiveUser = (activeUsers: User[], username: string): User | undefined => {
  return activeUsers.find((user) => user.name == username);
};

export const deleteUser = (activeUsers: User[], socketId: string): User[] => {
  return activeUsers.filter((user) => {
    return user.id != socketId;
  });
};

export const addUserRoom = (activeUsers: User[], socketId: string, roomName: string): User[] => {
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

export const removeUserRoom = (activeUsers: User[], socketId: string): User[] => {
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

export const getUser = (activeUsers: User[], socketId: string): User | undefined => {
  return activeUsers.find((user) => {
    return user.id === socketId;
  });
};

export const getUsersFromRoom = (activeUsers: User[], roomName: string): User[] => {
  return activeUsers.filter((user) => user.room === roomName);
};

export const updateUserStatus = (activeUsers: User[], socketId: string, ready: boolean): User[] => {
  return activeUsers.map((user) =>
    user.id === socketId
      ? { id: user.id, name: user.name, isReady: ready, progress: user.progress, room: user.room }
      : user
  );
};

export const usersStatus = (activeUsers: User[], roomName: string): boolean => {
  const usersFromRoom = getUsersFromRoom(activeUsers, roomName);

  return usersFromRoom.every((user) => user.isReady === true);
};

export const resetUserStatus = (activeUsers: User[], roomName: string): User[] => {
  return activeUsers.map((user) =>
    roomName === user.room ? { id: user.id, name: user.name, isReady: false, progress: 0, room: user.room } : user
  );
};
